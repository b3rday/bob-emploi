import {TFunction} from 'i18next'
import _isEqual from 'lodash/isEqual'
import _memoize from 'lodash/memoize'
import _pick from 'lodash/pick'
import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'

import {DispatchAllActions, RootState, onboardingCommentIsShown} from 'store/actions'

import {FastForward} from 'components/fast_forward'
import {isMobileVersion} from 'components/mobile'
import {Ellipsis} from 'components/phylactery'
import {Button, PaddedOnMobile, PercentBar} from 'components/theme'
import bobHeadImage from 'images/bob-head.svg'


type UpdateProfileComponent = React.Component<{
  onBack?: (value: bayes.bob.UserProfile) => void
  onChange?: (value: {profile: bayes.bob.UserProfile}) => void
  onSubmit?: (value: bayes.bob.UserProfile) => void
  profile: bayes.bob.UserProfile
}>


class ComponentProfileUpdater {
  protected component_: UpdateProfileComponent

  protected fieldNames_: {readonly [fieldName in keyof bayes.bob.UserProfile]?: boolean}

  protected requiredFields_: (keyof bayes.bob.UserProfile)[]

  public constructor(
    fieldNames: {readonly [fieldName in keyof bayes.bob.UserProfile]?: boolean},
    component: UpdateProfileComponent) {
    this.fieldNames_ = fieldNames
    this.requiredFields_ = (Object.keys(fieldNames) as (keyof bayes.bob.UserProfile)[]).
      filter((fieldName: (keyof bayes.bob.UserProfile)): boolean => !!fieldNames[fieldName])
    this.component_ = component
  }

  public isFormValid = (): boolean => {
    return this.requiredFields_.every(
      (fieldname): boolean => !!this.component_.props.profile[fieldname])
  }

  public handleSubmit = (): void => {
    this.component_.setState({isValidated: true})
    if (this.isFormValid()) {
      const fields = this.makeProfileDiff()
      const {onSubmit} = this.component_.props
      onSubmit && onSubmit(fields)
    }
  }

  public getBackHandler = (): (() => void)|undefined => {
    const {onBack} = this.component_.props
    if (!onBack) {
      return undefined
    }
    return (): void => {
      const fields = this.makeProfileDiff()
      onBack(fields)
    }
  }

  public makeProfileDiff(): bayes.bob.UserProfile {
    return _pick(this.component_.props.profile, Object.keys(this.fieldNames_))
  }

  public handleChange = _memoize((field: keyof bayes.bob.UserProfile): (<T>(value: T) => void) =>
    (value): void => {
      const {onChange, profile: {[field]: previousValue}} = this.component_.props
      if (!_isEqual(previousValue, value)) {
        onChange && onChange({profile: {[field]: value}})
      }
    })
}


class ProfileUpdater {
  protected fieldNames_: {readonly [fieldName in keyof bayes.bob.UserProfile]?: boolean}

  public constructor(fieldNames: {readonly [fieldName in keyof bayes.bob.UserProfile]?: boolean}) {
    this.fieldNames_ = fieldNames
  }

  public attachToComponent(component: UpdateProfileComponent):
  ComponentProfileUpdater {
    return new ComponentProfileUpdater(this.fieldNames_, component)
  }
}


export interface StepProps {
  buttonsOverride?: React.ReactNode
  contentStyle?: React.CSSProperties
  explanation?: React.ReactNode
  isNextButtonDisabled?: boolean
  isShownAsStepsDuringOnboarding: boolean
  nextButtonContent?: React.ReactNode
  onPreviousButtonClick?: (() => void) | null
  profile: bayes.bob.UserProfile
  stepNumber?: number
  style?: React.CSSProperties
  t: TFunction
  totalStepCount?: number
}


export interface ProfileStepProps extends StepProps {
  featuresEnabled: bayes.bob.Features
  hasAccount?: boolean
  onBack?: (value: bayes.bob.UserProfile) => void
  onChange?: (value: {profile: bayes.bob.UserProfile}) => void
  onSubmit?: (value: bayes.bob.UserProfile) => void
  title?: string
}


export interface ProjectStepProps extends StepProps {
  featuresEnabled?: bayes.bob.Features
  isShownAsStepsDuringOnboarding: true
  onSubmit: (newValue: bayes.bob.Project) => void
  newProject: bayes.bob.Project
}


interface BaseStepProps extends StepProps {
  children: React.ReactNode
  fastForward: () => void
  onNextButtonClick?: () => void
  progressInStep: number
  title?: string
}


class Step extends React.PureComponent<BaseStepProps> {
  public static propTypes = {
    buttonsOverride: PropTypes.node,
    children: PropTypes.node.isRequired,
    contentStyle: PropTypes.object,
    explanation: PropTypes.node,
    fastForward: PropTypes.func.isRequired,
    isNextButtonDisabled: PropTypes.bool,
    isShownAsStepsDuringOnboarding: PropTypes.bool,
    nextButtonContent: PropTypes.node,
    onNextButtonClick: PropTypes.func,
    onPreviousButtonClick: PropTypes.func,
    progressInStep: PropTypes.number.isRequired,
    stepNumber: PropTypes.number,
    style: PropTypes.object,
    t: PropTypes.func.isRequired,
    title: PropTypes.string,
    totalStepCount: PropTypes.number,
  }

  public static defaultProps = {
    progressInStep: 0,
  }

  public render(): React.ReactNode {
    const {buttonsOverride, children, explanation, fastForward, isShownAsStepsDuringOnboarding,
      nextButtonContent, onPreviousButtonClick, onNextButtonClick, contentStyle, progressInStep,
      style, stepNumber, totalStepCount, isNextButtonDisabled, t, title} = this.props
    const stepStyle: React.CSSProperties = {
      alignItems: isMobileVersion ? 'stretch' : 'center',
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      ...style,
    }
    const titleStyle: React.CSSProperties = {
      fontSize: 23,
      fontWeight: 500,
      lineHeight: 1.3,
      marginBottom: isMobileVersion && !isShownAsStepsDuringOnboarding ? 20 : 0,
      marginTop: isMobileVersion && !isShownAsStepsDuringOnboarding ? 0 : 40,
      textAlign: 'center',
    }
    const explanationStyle: React.CSSProperties = {
      color: colors.GREYISH_BROWN,
      fontSize: 14,
      lineHeight: 1.4,
      marginTop: 10,
      textAlign: 'center',
    }
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      marginTop: 33,
      padding: '0 20px',
      width: isMobileVersion ? 'initial' : 480,
      ...contentStyle,
    }
    const navigationStyle: React.CSSProperties = {
      display: 'flex',
      marginBottom: isMobileVersion ? 20 : 40,
      marginTop: 15,
    }
    const mobileButtonStyle: React.CSSProperties = {
      margin: '0 auto',
      minWidth: 130,
      padding: '13px 16px',
    }
    const buttonStyle = isMobileVersion ? mobileButtonStyle : {}
    const isLastOnboardingStep = totalStepCount && totalStepCount === stepNumber
    return <div style={stepStyle} className={isShownAsStepsDuringOnboarding ? '' : 'profile'}>
      <FastForward onForward={fastForward} />
      {title ? <PaddedOnMobile><div style={titleStyle}>{title}</div></PaddedOnMobile> : null}
      {stepNumber && totalStepCount ? <PercentBar
        color={colors.BOB_BLUE}
        height={15}
        percent={Math.round(100 * (stepNumber - 1 + progressInStep) / totalStepCount)}
        isPercentShown={false}
        style={{margin: '10px auto 0', maxWidth: 425, width: '90%'}}
      /> : null
      }
      {explanation ? <div style={explanationStyle}>{explanation}</div> : null}
      <div style={containerStyle}>
        {children}
      </div>
      {buttonsOverride ? buttonsOverride :
        onPreviousButtonClick || onNextButtonClick ? <div style={navigationStyle}>
          {onPreviousButtonClick ? <Button
            type="back" onClick={onPreviousButtonClick} style={{...buttonStyle, marginRight: 20}}
            isRound={true}>
            {t('Précédent')}
          </Button> : null}
          {onNextButtonClick ? <Button
            isRound={true}
            onClick={onNextButtonClick}
            disabled={isNextButtonDisabled}
            style={buttonStyle}>
            {nextButtonContent || (isLastOnboardingStep ?
              t('Terminer le questionnaire') : t('Suivant'))}
          </Button> : null}
        </div> : null}
    </div>
  }
}


interface OnboardingCommentContentProps {
  comment?: bayes.bob.BoldedString
  onShown?: () => void
  shouldWait?: boolean
  style?: React.CSSProperties
}


class OnboardingCommentContent extends React.PureComponent<OnboardingCommentContentProps> {
  public static propTypes = {
    comment: PropTypes.shape({
      stringParts: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    }),
    onShown: PropTypes.func,
    shouldWait: PropTypes.bool,
    style: PropTypes.object,
  }

  public state = {
    isWaiting: this.props.shouldWait,
  }

  public componentDidMount(): void {
    const {onShown, shouldWait} = this.props
    if (shouldWait) {
      clearTimeout(this.timeout)
      this.timeout = window.setTimeout((): void => {
        this.setState({isWaiting: false})
        onShown && onShown()
      }, 2000)
    } else {
      onShown && onShown()
    }
  }

  public componentWillUnmount(): void {
    clearTimeout(this.timeout)
  }

  private timeout: number|undefined

  public render(): React.ReactNode {
    const {comment: {stringParts = []} = {}, style} = this.props
    const {isWaiting} = this.state
    if (!stringParts.length) {
      return <div style={{marginBottom: 25, ...style}} />
    }
    const containerStyle = {
      alignItems: 'start',
      display: 'flex',
      marginBottom: 30,
      marginTop: 10,
      ...style,
    }
    const textStyle = {
      backgroundColor: colors.NEW_GREY,
      borderRadius: '5px 15px 15px',
      flex: 1,
      lineHeight: 1.5,
      marginLeft: 13,
      marginTop: 10,
      padding: '10px 15px 5px 10px',
    }
    const ellipsisStyle: React.CSSProperties = {
      margin: '10px 0',
    }
    return <div style={containerStyle}>
      <img style={{width: 30}} src={bobHeadImage} alt={config.productName} />
      {isWaiting ? <Ellipsis style={ellipsisStyle} /> :
        <div style={textStyle}>
          {stringParts.map((str, index): React.ReactNode =>
            <span style={{fontWeight: index % 2 ? 'bold' : 'initial'}} key={index}>{str}</span>)}
        </div>}
    </div>
  }
}


interface OnboardingCommentConnectedProps {
  commentAfter?: ValidDiagnosticComment
  commentBefore?: ValidDiagnosticComment
  isFetching: boolean
}


interface OnboardingCommentProps extends OnboardingCommentConnectedProps {
  children?: React.ReactNode
  computingDelayMillisecs?: number
  dispatch: DispatchAllActions
  field: bayes.bob.ProjectOrProfileField
  onDone: () => void
  readingDelayMillisec?: number
  shouldShowAfter: boolean
}


interface OnboardingCommentState {
  isComputing?: boolean
  shownComment?: ValidDiagnosticComment
}


class OnboardingCommentBase
  extends React.PureComponent<OnboardingCommentProps, OnboardingCommentState> {
  private static bestComment(
    {commentAfter, commentBefore, shouldShowAfter}: OnboardingCommentProps,
  ): ValidDiagnosticComment|undefined {
    return shouldShowAfter && commentAfter || commentBefore
  }

  public static propTypes = {
    children: PropTypes.node,
    // Comment shown after the user has answered.
    commentAfter: PropTypes.shape({
      comment: PropTypes.shape({
        stringParts: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
      }).isRequired,
    }),
    // Comment shown before the user has answered.
    commentBefore: PropTypes.shape({
      comment: PropTypes.shape({
        stringParts: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
      }).isRequired,
    }),
    // Minimal duration of the wait before the commentAfter is shown. If fetching the comment is
    // longer the wait won't be delayed unnecessarily.
    computingDelayMillisecs: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
    isFetching: PropTypes.bool,
    onDone: PropTypes.func.isRequired,
    // Duration of the wait after the commentAfter is shown, to let the user read the comment before
    // resuming filling the form.
    // TODO(cyrille): Remove all this logic.
    readingDelayMillisec: PropTypes.number,
    // Whether the user has answered.
    shouldShowAfter: PropTypes.bool,
  }

  public static defaultProps = {
    computingDelayMillisecs: 0,
    onDone: (): void => {
      // Do nothing.
    },
    readingDelayMillisec: 0,
  }

  public state: OnboardingCommentState = {
    isComputing: this.props.shouldShowAfter,
  }

  public static getDerivedStateFromProps(
    props: OnboardingCommentProps, prevState: OnboardingCommentState): OnboardingCommentState|null {
    const {isComputing, shownComment} = prevState
    if (isComputing) {
      if (props.commentBefore && props.commentBefore !== shownComment) {
        return {shownComment: props.commentBefore}
      }
      return null
    }
    const bestComment = OnboardingCommentBase.bestComment(props)
    if (bestComment !== shownComment) {
      return {shownComment: bestComment}
    }
    return null
  }

  public componentDidMount(): void {
    const {commentAfter, isFetching, computingDelayMillisecs, dispatch, onDone,
      shouldShowAfter} = this.props
    const {shownComment} = this.state
    if (shownComment && !shownComment.hasBeenShown) {
      dispatch(onboardingCommentIsShown(shownComment))
    }
    if (!shouldShowAfter) {
      return
    }
    if (!isFetching && !commentAfter) {
      onDone()
    }

    this.computingTimeout = window.setTimeout((): void => this.setState({
      isComputing: false,
      shownComment: OnboardingCommentBase.bestComment(this.props),
    }), computingDelayMillisecs)
  }

  public componentDidUpdate(
    {isFetching: wasFetching, shouldShowAfter: didShowAfter}: OnboardingCommentProps,
    {shownComment: prevShownComment}: OnboardingCommentState): void {
    const {shownComment} = this.state
    const {commentAfter, dispatch, isFetching, onDone, readingDelayMillisec,
      shouldShowAfter} = this.props
    if ((!prevShownComment || prevShownComment.hasBeenShown) &&
      shownComment && !shownComment.hasBeenShown) {
      dispatch(onboardingCommentIsShown(shownComment))
    }
    if (shouldShowAfter && didShowAfter && prevShownComment !== shownComment) {
      clearTimeout(this.readingTimeout)
      this.readingTimeout = window.setTimeout(onDone, shownComment ? readingDelayMillisec : 0)
    }
    if (shouldShowAfter && wasFetching && !isFetching && !commentAfter) {
      onDone()
    }
  }

  public componentWillUnmount(): void {
    clearTimeout(this.computingTimeout)
    clearTimeout(this.readingTimeout)
  }

  private computingTimeout?: number

  private readingTimeout?: number

  public render(): React.ReactNode {
    const {shownComment} = this.state
    const {
      commentAfter: omittedCommentAfter,
      commentBefore: omittedCommentBefore,
      computingDelayMillisecs: omittedComputingDelayMillisecs,
      dispatch: omittedDispatch,
      field: omittedField,
      onDone: omittedOnDone,
      readingDelayMillisec: omittedReadingDelayMillisec,
      shouldShowAfter: omittedShouldShowAfter,
      ...otherProps
    } = this.props
    return <OnboardingCommentContent
      comment={shownComment && shownComment.comment}
      shouldWait={!shownComment || !shownComment.hasBeenShown} {...otherProps} />
  }
}
// This component adds a comment from server relevant for the given field.
//
// It expects a `field` prop to know which comments from server are relevant.
//
// It needs to be invoked with a key prop to ensure it will be reset every time its
// comment might be recomputed. For instance, on TARGET_JOB_FIELD,
// use key={targetJob && targetJob.codeOgr || ''}.
const OnboardingComment = connect(
  (
    {
      app: {quickDiagnostic: {after, before} = {after: {}, before: {}}},
      asyncState: {isFetching},
    }: RootState,
    {field}: {field: bayes.bob.ProjectOrProfileField},
  ): OnboardingCommentConnectedProps => ({
    commentAfter: after[field],
    commentBefore: before[field],
    isFetching: !!isFetching['DIAGNOSE_ONBOARDING'],
  }),
)(OnboardingCommentBase)


export {Step, ProfileUpdater, OnboardingComment, OnboardingCommentContent}
