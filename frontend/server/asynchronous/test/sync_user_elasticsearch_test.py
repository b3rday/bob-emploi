"""Unit tests for the module sync_user_elasticsearch."""

import collections
import datetime
import json
import os
import typing
from typing import Any, Dict, List, Optional
import unittest
from unittest import mock

from google.protobuf import json_format
import mongomock
import requests
import requests_mock

from bob_emploi.frontend.api import user_pb2
from bob_emploi.frontend.server import now
from bob_emploi.frontend.server.asynchronous import sync_user_elasticsearch

if typing.TYPE_CHECKING:
    # TODO(pascal): Drop once requests_mock gets typed.
    class _RequestsMock(typing.Protocol):

        def get(  # pylint: disable=invalid-name
                self, path: str, status_code: int = 200, text: str = '',
                json: Any = None,  # pylint: disable=redefined-outer-name
                headers: Optional[Dict[str, str]] = None) -> requests.Response:
            """Decide what to do when a get request is sent."""

        def post(  # pylint: disable=invalid-name
                self, path: str, status_code: int = 200, text: str = '',
                json: Any = None,  # pylint: disable=redefined-outer-name
                headers: Optional[Dict[str, str]] = None,
                request_headers: Optional[Dict[str, str]] = None) -> requests.Response:
            """Decide what to do when a post request is sent."""


@mock.patch(now.__name__ + '.get', new=lambda: datetime.datetime(2017, 11, 16))
@mock.patch('logging.info', new=mock.MagicMock)
class SyncTestCase(unittest.TestCase):
    """Unit tests for the module."""

    def setUp(self) -> None:
        super().setUp()
        sync_user_elasticsearch.proto.clear_mongo_fetcher_cache()
        self._db = mongomock.MongoClient().test
        self._user_db = mongomock.MongoClient().test
        patcher = mock.patch(sync_user_elasticsearch.__name__ + '._USER_DB', new=self._user_db)
        patcher.start()
        patcher = mock.patch(sync_user_elasticsearch.__name__ + '._DB', new=self._db)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.mock_elasticsearch = mock.MagicMock()

    @mock.patch(sync_user_elasticsearch.random.__name__ + '.randint')
    def test_main(self, mock_randint: mock.MagicMock) -> None:
        """Test main."""

        mock_randint.return_value = 42
        self.maxDiff = None  # pylint: disable=invalid-name
        self._user_db.user.insert_one({
            'profile': {
                'canTutoie': True,
                'coachingEmailFrequency': 'EMAIL_MAXIMUM',
                'email': 'pascal@corpet.net',
                'gender': 'MASCULINE',
                'yearOfBirth': 1982,
                'highestDegree': 'DEA_DESS_MASTER_PHD',
                'origin': 'FROM_A_FRIEND',
            },
            'projects': [{
                'createdAt': '2018-12-01T00:00:00Z',
                'kind': 'FIND_ANOTHER_JOB',
                'targetJob': {
                    'name': 'Boulanger',
                    'jobGroup': {'name': 'Boulangerie', 'romeId': 'D0001'},
                },
                'areaType': 'REGION',
                'city': {
                    'cityId': '69123',
                    'name': 'Lyon',
                    'departementName': 'Rhône',
                    'regionName': 'Auvergne-Rhône-Alpes',
                    'urbanScore': 7,
                },
                'jobSearchStartedAt': '2018-08-01T00:00:00Z',
                'minSalary': 45000,
                'advices': [
                    {
                        'adviceId': 'network',
                        'numStars': 3,
                        'status': 'ADVICE_RECOMMENDED',
                    },
                    {
                        'adviceId': 'read-more',
                        'numStars': 1,
                        'status': 'ADVICE_READ',
                    },
                    {
                        'adviceId': 'life-balance',
                        'numStars': 1,
                        'status': 'ADVICE_READ',
                    },
                ],
                'feedback': {
                    'score': 5,
                },
                'diagnostic': {
                    'categoryId': 'stuck-market',
                },
            }],
            'employmentStatus': [{
                'bobHasHelped': 'YES',
                'bobRelativePersonalization': 12,
                'createdAt': '2017-07-25T18:06:08Z',
                'otherCoachesUsed': ['PE_COUNSELOR_MEETING', 'MUTUAL_AID_ORGANIZATION'],
            }],
            'clientMetrics': {
                'amplitudeId': '1234ab34f13e5',
                'firstSessionDurationSeconds': 250,
                'isFirstSessionMobile': 'TRUE',
            },
            'emailsSent': [
                # Ignored because there's another one that was read later.
                {
                    'campaignId': 'focus-network',
                    'sentAt': '2017-10-15T18:06:08Z',
                    'status': 'EMAIL_SENT_SENT',
                },
                {
                    'campaignId': 'focus-spontaneous',
                    'sentAt': '2017-10-15T18:06:08Z',
                    'status': 'EMAIL_SENT_OPENED',
                },
                {
                    'campaignId': 'focus-network',
                    'sentAt': '2017-11-15T18:06:08Z',
                    'status': 'EMAIL_SENT_CLICKED',
                },
            ],
            'origin': {
                'source': 'facebook',
                'medium': 'ad',
            },
            'registeredAt': '2017-07-15T18:06:08Z',
            'hasAccount': True,
        })
        self._db.cities.insert_one({
            '_id': '69123',
            'name': 'Lyon',
            'urbanContext': 2,
        })
        user_id = str(self._user_db.user.find_one()['_id'])

        sync_user_elasticsearch.main(self.mock_elasticsearch, [
            '--registered-from', '2017-07',
            '--no-dry-run', '--disable-sentry'])

        self.mock_elasticsearch.create.assert_called_once()
        kwargs = self.mock_elasticsearch.create.call_args[1]
        body = kwargs.pop('body')
        self.assertEqual(
            {
                'index': 'bobusers',
                'doc_type': '_doc',
                'id': user_id,
            },
            kwargs)
        self.assertEqual(
            {
                'randomGroup': .42,
                'profile': {
                    'ageGroup': 'D. 35-44',
                    'canTutoie': True,
                    'coachingEmailFrequency': 'EMAIL_MAXIMUM',
                    'frustrations': [],
                    'gender': 'MASCULINE',
                    'hasHandicap': False,
                    'highestDegree': '6 - DEA_DESS_MASTER_PHD',
                    'origin': 'FROM_A_FRIEND',
                },
                'project': {
                    'advices': ['network'],
                    'readAdvices': ['read-more', 'life-balance'],
                    'numAdvicesRead': 2,
                    'job_search_length_months': 4,
                    'isComplete': True,
                    'kind': 'FIND_ANOTHER_JOB',
                    'areaType': 'REGION',
                    'city': {
                        'regionName': 'Auvergne-Rhône-Alpes',
                        'urbanScore': 7,
                        'urbanContext': '2 - PERIURBAN',
                    },
                    'targetJob': {
                        'domain': 'Commerce, vente et grande distribution',
                        'name': 'Boulanger',
                        'job_group': {
                            'name': 'Boulangerie',
                        },
                    },
                    'feedbackScore': 5,
                    'feedbackLoveScore': 1,
                    'minSalary': 45000,
                    'diagnostic': {
                        'categoryId': 'stuck-market',
                    }
                },
                'registeredAt': '2017-07-15T18:06:08Z',
                'employmentStatus': {
                    'bobHasHelped': 'YES',
                    'bobHasHelpedScore': 1,
                    'createdAt': '2017-07-25T18:06:08Z',
                    'daysSinceRegistration': 10,
                    'otherCoachesUsed': ['PE_COUNSELOR_MEETING', 'MUTUAL_AID_ORGANIZATION'],
                    'bobRelativePersonalization': 12,
                },
                'emailsSent': {
                    'focus-network': 'EMAIL_SENT_CLICKED',
                    'focus-spontaneous': 'EMAIL_SENT_OPENED',
                },
                'clientMetrics': {
                    'firstSessionDurationSeconds': 250,
                    'isFirstSessionMobile': 'TRUE',
                },
                'origin': {
                    'medium': 'ad',
                    'source': 'facebook',
                },
                'hasAccount': True,
                'isHooked': True,
            },
            json.loads(body))

    @mock.patch('logging.error')
    @mock.patch(sync_user_elasticsearch.report.__name__ + '.setup_sentry_logging')
    def test_report_sentry(self, mock_report: mock.MagicMock, mock_error: mock.MagicMock) \
            -> None:
        """Test the error message if we forgot to set SENTRY reporting."""

        mock_report.side_effect = ValueError

        sync_user_elasticsearch.main(
            self.mock_elasticsearch, ['--registered-from', '2017-07', '--no-dry-run'])

        mock_error.assert_called_once_with(
            'Please set SENTRY_DSN to enable logging to Sentry, or use --disable-sentry option')

    def _check_city_corner_case(
            self, expected_city: Dict[str, Any], city_json: Dict[str, Any]) -> None:

        self._user_db.user.insert_one({
            'projects': [{'city': {'cityId': '69123'}}],
            'registeredAt': '2017-07-15T18:06:08Z',
        })
        self._db.cities.insert_one(dict(**city_json, _id='69123'))

        sync_user_elasticsearch.main(self.mock_elasticsearch, [
            '--registered-from', '2017-07',
            '--no-dry-run', '--disable-sentry'])

        self.mock_elasticsearch.create.assert_called_once()
        body = json.loads(self.mock_elasticsearch.create.call_args[1]['body'])
        city = body['project']['city']
        del city['regionName']
        del city['urbanScore']
        self.assertEqual(expected_city, body['project']['city'])

    def test_snake_case_field_in_city(self) -> None:
        """Try with a city containing fields in snake case instead of camel case."""

        self._check_city_corner_case({'urbanContext': '3 - URBAN'}, {'urban_context': 3})

    def test_float_for_enum_field_in_city(self) -> None:
        """Try with a city containing a float to define an enum."""

        self._check_city_corner_case({'urbanContext': '3 - URBAN'}, {'urbanContext': 3.})

    def test_string_for_enum_field_in_city(self) -> None:
        """Try with a city containing a string to define an enum."""

        self._check_city_corner_case({'urbanContext': '3 - URBAN'}, {'urbanContext': 'URBAN'})

    @requests_mock.mock()
    @mock.patch.dict(os.environ, {
        'ELASTICSEARCH_URL': 'http://elastic-dev:9200',
        'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI': '/get-my-credentials',
    })
    def test_es_client_from_env_aws_in_docker(self, mock_requests: '_RequestsMock') -> None:
        """Get an Elasticsearch client for a task running in AWS ECS Docker."""

        mock_requests.get(
            'http://169.254.170.2/get-my-credentials',
            json={'AccessKeyId': 'my-access-key', 'SecretAccessKey': 'super-secret'})
        client = sync_user_elasticsearch.get_es_client_from_env()
        http_auth = client.transport.kwargs['http_auth']
        self.assertEqual('my-access-key', http_auth.access_id)
        self.assertEqual('super-secret', http_auth.signing_key.secret_key)
        self.assertEqual('es', http_auth.service)

    @mock.patch.dict(os.environ, {
        'ELASTICSEARCH_URL': 'http://elastic-dev:9200',
        'AWS_ACCESS_KEY_ID': 'my-access-key',
        'AWS_SECRET_ACCESS_KEY': 'mega-secret',
    })
    def test_es_client_for_aws_access(self) -> None:
        """Get an Elasticsearch client that can access a server on AWS."""

        client = sync_user_elasticsearch.get_es_client_from_env()
        http_auth = client.transport.kwargs['http_auth']
        self.assertEqual('my-access-key', http_auth.access_id)
        self.assertEqual('mega-secret', http_auth.signing_key.secret_key)
        self.assertEqual('es', http_auth.service)

    @mock.patch.dict(os.environ, {
        'ELASTICSEARCH_URL': 'http://elastic-dev:9200',
        'AWS_SECRET_ACCESS_KEY': 'mega-secret',
    })
    def test_es_client_for_aws_access_without_key(self) -> None:
        """Try getting an Elasticsearch client that can access a server on AWS with no key."""

        client = sync_user_elasticsearch.get_es_client_from_env()
        http_auth = client.transport.kwargs['http_auth']
        self.assertFalse(http_auth)

    def _compute_user_data(self, user: user_pb2.User) -> Dict[str, Any]:
        if not user.HasField('registered_at'):
            user.registered_at.GetCurrentTime()
        self._user_db.user.drop()
        self._user_db.user.insert_one(json_format.MessageToDict(user))
        sync_user_elasticsearch.main(self.mock_elasticsearch, [
            '--registered-from', '2017-07',
            '--no-dry-run', '--disable-sentry'])
        kwargs = self.mock_elasticsearch.create.call_args[1]
        return typing.cast(Dict[str, Any], json.loads(kwargs.pop('body')))

    def test_infinite_salary(self) -> None:
        """Test that infinite salaries are not kept."""

        user = user_pb2.User()
        project = user.projects.add()
        project.min_salary = float('inf')

        data = self._compute_user_data(user)

        self.assertNotIn('minSalary', data['project'])

    def test_nan_salary(self) -> None:
        """Test that NaN salaries are not kept."""

        user = user_pb2.User()
        project = user.projects.add()
        project.min_salary = float('nan')

        data = self._compute_user_data(user)

        self.assertNotIn('minSalary', data['project'])

    def test_age_group(self) -> None:
        """Test various age groups."""

        age_group_counts: Dict[str, int] = collections.defaultdict(int)
        age_groups: List[str] = []

        for year in range(1940, 2020):
            user = user_pb2.User()
            user.profile.year_of_birth = year
            data = self._compute_user_data(user)
            age_group = data.get('profile', {}).get('ageGroup')
            age_group_counts[age_group] += 1
            age_groups.append(age_group)

        self.assertEqual(
            sorted(age_groups, reverse=True), age_groups, msg='Grouping ages should keep ordering')

        self.assertEqual(
            {'A. -18', 'B. 18-24', 'C. 25-34', 'D. 35-44', 'E. 45-54', 'F. 55-64', 'G. 65+'},
            set(age_group_counts.keys()))

    def _compute_user_data_for_nps(self, responded_at: datetime.datetime, score: int) \
            -> Dict[str, Any]:
        user = user_pb2.User()
        response = user.net_promoter_score_survey_response
        response.responded_at.FromDatetime(responded_at)
        response.score = score
        return self._compute_user_data(user)

    def test_nps_best_score(self) -> None:
        """Test NPS best score."""

        data = self._compute_user_data_for_nps(datetime.datetime(2018, 11, 20, 18, 29), 10)
        self.assertEqual(
            {'score': 10, 'time': '2018-11-20T18:29:00Z', 'loveScore': 1},
            data.get('nps_response'))

    def test_nps_medium_score(self) -> None:
        """Test NPS medium score."""

        data = self._compute_user_data_for_nps(datetime.datetime(2018, 11, 20, 18, 29), 7)
        self.assertEqual(
            {'score': 7, 'time': '2018-11-20T18:29:00Z', 'loveScore': 0},
            data.get('nps_response'))

    def test_nps_bad_score(self) -> None:
        """Test NPS bad score."""

        data = self._compute_user_data_for_nps(datetime.datetime(2018, 11, 20, 18, 29), 0)
        self.assertEqual(
            {'score': 0, 'time': '2018-11-20T18:29:00Z', 'loveScore': -1},
            data.get('nps_response'))

    @mock.patch('logging.warning')
    def test_nps_crazy_score(self, mock_warning: mock.MagicMock) -> None:
        """NPS crazy score."""

        data = self._compute_user_data_for_nps(datetime.datetime(2018, 11, 20, 18, 29), 200)
        self.assertEqual(
            {'score': 200, 'time': '2018-11-20T18:29:00Z'},
            data.get('nps_response'))

        mock_warning.assert_called_once_with('Cannot convert nps_score %s', 200)

    def test_nps_request(self) -> None:
        """NPS request computation."""

        user = user_pb2.User()
        user.registered_at.FromDatetime(datetime.datetime(2019, 10, 19, 20, 31, 33))
        nps_email = user.emails_sent.add(campaign_id='nps')
        nps_email.sent_at.FromDatetime(datetime.datetime(2019, 10, 22, 8, 15))
        user.net_promoter_score_survey_response.responded_at.FromDatetime(
            datetime.datetime(2019, 10, 22, 8, 15))
        data = self._compute_user_data(user)
        self.assertEqual(
            {'hasResponded': True, 'sentAfterDays': 2},
            data.get('nps_request'))

    def _compute_data_bob_has_helped(
            self, created_at: datetime.datetime, bob_has_helped: str) -> Dict[str, Any]:
        user = user_pb2.User()
        user.registered_at.FromDatetime(now.get())
        status = user.employment_status.add()
        status.bob_has_helped = bob_has_helped
        status.created_at.FromDatetime(created_at)
        return self._compute_user_data(user)

    def test_no_bob_has_helped(self) -> None:
        """No Bob has helped."""

        data = self._compute_data_bob_has_helped(
            datetime.datetime(2018, 11, 20, 18, 29), '')
        self.assertEqual(
            {
                'createdAt': '2018-11-20T18:29:00Z',
                'daysSinceRegistration': 369,
            },
            data.get('employmentStatus'))

    def test_bob_has_helped(self) -> None:
        """Bob has helped."""

        data = self._compute_data_bob_has_helped(
            datetime.datetime(2018, 11, 20, 18, 29), 'YES_A_LOT')
        self.assertEqual(
            {
                'bobHasHelped': 'YES_A_LOT',
                'bobHasHelpedScore': 1,
                'createdAt': '2018-11-20T18:29:00Z',
                'daysSinceRegistration': 369,
            },
            data.get('employmentStatus'))

    def test_bob_has_not_helped(self) -> None:
        """Bob has not helped."""

        data = self._compute_data_bob_has_helped(
            datetime.datetime(2018, 11, 20, 18, 29), 'NO')
        self.assertEqual(
            {
                'bobHasHelped': 'NO',
                'bobHasHelpedScore': -1,
                'createdAt': '2018-11-20T18:29:00Z',
                'daysSinceRegistration': 369,
            },
            data.get('employmentStatus'))

    @mock.patch('logging.warning')
    def test_bob_has_helped_is_weird(self, mock_warning: mock.MagicMock) -> None:
        """Bob has not helped."""

        data = self._compute_data_bob_has_helped(
            datetime.datetime(2018, 11, 20, 18, 29), 'WEIRD')
        self.assertEqual(
            {
                'bobHasHelped': 'WEIRD',
                'createdAt': '2018-11-20T18:29:00Z',
                'daysSinceRegistration': 369,
            },
            data.get('employmentStatus'))

        mock_warning.assert_called_once_with('bobHasHelped field has unknown answer "%s"', 'WEIRD')

    def _compute_data_feedback_score(self, feedback_score: int) -> Dict[str, Any]:
        user = user_pb2.User()
        project = user.projects.add()
        project.feedback.score = feedback_score
        return self._compute_user_data(user)

    def test_low_feedback_score(self) -> None:
        """Low feedback score."""

        data = self._compute_data_feedback_score(1)
        self.assertEqual(
            {
                'feedbackScore': 1,
                'feedbackLoveScore': -1,
            },
            {k: v for k, v in data.get('project', {}).items() if k.startswith('feedback')})

    def test_good_feedback_score(self) -> None:
        """Good feedback score."""

        data = self._compute_data_feedback_score(5)
        self.assertEqual(
            {
                'feedbackScore': 5,
                'feedbackLoveScore': 1,
            },
            {k: v for k, v in data.get('project', {}).items() if k.startswith('feedback')})

    def test_medium_feedback_score(self) -> None:
        """Medium feedback score."""

        data = self._compute_data_feedback_score(3)
        self.assertEqual(
            {
                'feedbackScore': 3,
                'feedbackLoveScore': 0,
            },
            {k: v for k, v in data.get('project', {}).items() if k.startswith('feedback')})

    @mock.patch('logging.warning')
    def test_feedback_score_out_of_bounds(self, mock_warning: mock.MagicMock) -> None:
        """Feedback score way too high."""

        data = self._compute_data_feedback_score(51)
        self.assertEqual(
            {
                'feedbackScore': 51,
            },
            {k: v for k, v in data.get('project', {}).items() if k.startswith('feedback')})

        mock_warning.assert_called_once_with('Cannot convert feedback_score %s', 51)


if __name__ == '__main__':
    unittest.main()
