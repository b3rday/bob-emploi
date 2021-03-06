"""Asynchronous script to time out CVs and motivation letters reviews."""

import argparse
import datetime
import logging
import typing
from typing import Any, Dict, List, Optional

from bob_emploi.frontend.api import review_pb2
from bob_emploi.frontend.server import mongo
from bob_emploi.frontend.server import proto
from bob_emploi.frontend.server import now

_, _USER_DB, _ = mongo.get_connections_from_env()


def main(string_args: Optional[List[str]] = None) -> None:
    """Time out CVS and motivation letters reviews."""

    parser = argparse.ArgumentParser(
        description='Time out CVs and motivation letters reviews.',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('--days-before-timeout', default='5', type=int)

    args = parser.parse_args(string_args)

    timeout_date = now.get() - datetime.timedelta(days=args.days_before_timeout)

    documents = _USER_DB.cvs_and_cover_letters.find({
        'reviews': {'$elemMatch': {
            'sentAt': {'$lt': proto.datetime_to_json_string(timeout_date)},
            'status': 'REVIEW_SENT',
        }},
    })
    for document in documents:
        _timeout_old_reviews(document, timeout_date)


def _timeout_old_reviews(
        document_dict: Dict[str, Any], timeout_date: datetime.datetime) -> None:
    document_id = document_dict.pop('_id')
    document = typing.cast(
        review_pb2.DocumentToReview,
        proto.create_from_mongo(document_dict, review_pb2.DocumentToReview))
    timeout_review_indices = [
        review_index
        for review_index, review in enumerate(document.reviews)
        if review.status == review_pb2.REVIEW_SENT and review.sent_at.ToDatetime() < timeout_date
    ]
    if not timeout_review_indices:
        logging.warning('Mismatch between mongo and python filters')
        return
    _USER_DB.cvs_and_cover_letters.update_one(
        {'_id': document_id},
        {
            '$inc': {'numPendingReviews': -len(timeout_review_indices)},
            '$set': {
                f'reviews.{review_index}.status': 'REVIEW_TIME_OUT'
                for review_index in timeout_review_indices
            },
        },
    )


if __name__ == '__main__':
    main()
