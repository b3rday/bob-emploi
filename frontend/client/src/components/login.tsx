import Storage from 'local-storage-fallback'
import _memoize from 'lodash/memoize'
import AccountOutlineIcon from 'mdi-react/AccountOutlineIcon'
import EmailOutlineIcon from 'mdi-react/EmailOutlineIcon'
import GoogleIcon from 'mdi-react/GoogleIcon'
import LockOutlineIcon from 'mdi-react/LockOutlineIcon'
import PropTypes from 'prop-types'
import {parse, stringify} from 'query-string'
import React from 'react'
import FacebookLogin, {ReactFacebookLoginProps} from 'react-facebook-login'
import GoogleLogin from 'react-google-login'
import {connect} from 'react-redux'
import {RouteComponentProps, withRouter} from 'react-router'
import {Link} from 'react-router-dom'

import {DispatchAllActions, RootState, askPasswordReset, changePassword, closeLoginModal,
  displayToasterMessage, emailCheck, facebookAuthenticateUser, googleAuthenticateUser,
  linkedInAuthenticateUser, loginUser, noOp, openLoginModal, openRegistrationModal,
  peConnectAuthenticateUser, registerNewUser, resetPassword, startAsGuest} from 'store/actions'
import {getUniqueExampleEmail} from 'store/user'
import {validateEmail} from 'store/validations'

import {FastForward} from 'components/fast_forward'
import {isMobileVersion} from 'components/mobile'
import {Modal, ModalCloseButton} from 'components/modal'
import {ButtonProps, Button, CircularProgress, IconInput, LabeledToggle, Styles,
  chooseImageVersion} from 'components/theme'
import {Routes} from 'components/url'
import linkedInIcon from 'images/linked-in.png'
import logoProductImage from 'images/logo-bob-beta.svg'
import peConnectIcon from 'images/pole-emploi-connect.svg'
import portraitCoverImage from 'images/catherine_portrait.jpg?multi&sizes[]=1440&sizes[]=600'


// TODO(cyrille): Add 'pfccompetences', 'api_peconnect-competencesv2' once we have upgraded
// to competences v2.
const PE_CONNECT_SCOPES = ['api_peconnect-individuv1', 'profile', 'email', 'coordonnees',
  'api_peconnect-coordonneesv1', 'openid']

const LINKEDIN_SCOPES = ['r_liteprofile', 'r_emailaddress']

const toLocaleLowerCase = (email: string): string => email.toLocaleLowerCase()

const stopPropagation = (event): void => event.stopPropagation()

interface LoginConnectedProps {
  isAskingForPasswordReset?: boolean
  isAuthenticatingEmail?: boolean
  isAuthenticatingOther?: boolean
}

interface LoginProps extends LoginConnectedProps {
  defaultEmail: string
  dispatch: DispatchAllActions
  onLogin: (user: bayes.bob.User) => void
  onShowRegistrationFormClick: () => void
  stateToStore: StoredState
  storedState?: StoredState
}

interface LoginState {
  email: string
  hashSalt: string
  isTryingToResetPassword: boolean
  password: string
  passwordResetRequestedEmail?: string
}

class LoginFormBase extends React.PureComponent<LoginProps, LoginState> {
  public static propTypes = {
    defaultEmail: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    isAskingForPasswordReset: PropTypes.bool,
    isAuthenticatingEmail: PropTypes.bool,
    isAuthenticatingOther: PropTypes.bool,
    onLogin: PropTypes.func.isRequired,
    onShowRegistrationFormClick: PropTypes.func.isRequired,
  }

  public state: LoginState = {
    email: this.props.defaultEmail || '',
    hashSalt: '',
    isTryingToResetPassword: false,
    password: '',
    passwordResetRequestedEmail: undefined,
  }

  private handleEmailChange = (email: string): void => this.setState({email})

  private handlePasswordChange = (password: string): void => this.setState({password})

  private handleLogin = (event?): void => {
    const {dispatch} = this.props
    if (event && event.preventDefault) {
      event.preventDefault()
    }
    if (!this.isFormValid()) {
      return
    }
    dispatch(emailCheck(this.state.email)).
      then((response): bayes.bob.AuthResponse | void => {
        if (response && response.hashSalt) {
          this.setState({hashSalt: response.hashSalt})
        }
        return response
      }).
      then((response): bayes.bob.AuthResponse | void => {
        if (!response) {
          return response
        }
        if (response.isNewUser) {
          // TODO: Emphasize to registration form if response.isNewUser
          dispatch(displayToasterMessage("L'utilisateur n'existe pas."))
          return
        }
        const {email, password, hashSalt} = this.state
        // TODO: Use different API endpoints for login and registration.
        dispatch(loginUser(email, password, hashSalt)).
          then((response): bayes.bob.AuthResponse | void => {
            if (response && response.authenticatedUser) {
              this.props.onLogin(response.authenticatedUser)
              // TODO: Take care of the else case when the authentication was
              // not successful but we got back some new salt. (response.hashSalt)
            }
            return response
          })
        return response
      })
  }

  private handleLostPasswordClick = (event): void => {
    const {dispatch} = this.props
    const {email} = this.state
    if (event) {
      event.preventDefault()
    }
    if (!validateEmail(email)) {
      dispatch(displayToasterMessage(
        'Entrez correctement votre email dans le champs ci-dessus pour récupérer ' +
          'votre mot de passe.'))
      this.setState({isTryingToResetPassword: true})
      return
    }
    dispatch(askPasswordReset(email)).then((response): bayes.bob.AuthResponse | void => {
      if (response) {
        this.setState({passwordResetRequestedEmail: email})
        return response
      }
    })
  }

  private isFormValid = (): boolean => {
    const {email, isTryingToResetPassword, password} = this.state
    return !!((isTryingToResetPassword || password) && validateEmail(email))
  }

  private fastForward = (): void => {
    const {email, password} = this.state
    if (this.isFormValid()) {
      this.handleLogin()
      return
    }
    this.setState({
      email: email || 'test@example.com',
      // Let's hope it's the right password.
      password: password || 'password',
    })
  }

  public render(): React.ReactNode {
    const {email, isTryingToResetPassword, password, passwordResetRequestedEmail} = this.state
    const {isAskingForPasswordReset, isAuthenticatingEmail,
      isAuthenticatingOther, onLogin, stateToStore, storedState} = this.props
    const loginBoxStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      marginTop: 15,
    }
    const lostPasswordLinkStyle: React.CSSProperties = {
      color: colors.COOL_GREY,
      display: 'inline-block',
      fontSize: 13,
      marginLeft: 15,
      marginTop: 12,
      textDecoration: 'none',
    }
    const handleSubmit = isTryingToResetPassword ? this.handleLostPasswordClick : this.handleLogin
    return <form style={loginBoxStyle} onSubmit={handleSubmit}>
      <FastForward onForward={this.fastForward} />
      <FormHeader
        title={isTryingToResetPassword ? 'Mot de passe oublié ?' : "S'identifier"}
        question={isTryingToResetPassword ? '' : 'Pas encore de compte ?'}
        linkText="Inscrivez-vous !"
        onClick={this.props.onShowRegistrationFormClick} />

      <SocialLoginButtons stateToStore={stateToStore} storedState={storedState} onLogin={onLogin} />

      <FormSection title="Identification par mot de passe">
        <IconInput
          shouldFocusOnMount={!email}
          type="email" autoComplete="current-password"
          placeholder="Email" value={email} iconComponent={EmailOutlineIcon}
          applyFunc={toLocaleLowerCase}
          iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
          onChange={this.handleEmailChange} />
        {isTryingToResetPassword ? null : <IconInput
          iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
          type="password" autoComplete="new-password"
          shouldFocusOnMount={!!email}
          placeholder="Mot de passe" value={password} iconComponent={LockOutlineIcon}
          onChange={this.handlePasswordChange}
          style={{marginTop: 10}} />}
      </FormSection>

      {isTryingToResetPassword ? null : <a
        style={{...lostPasswordLinkStyle, cursor: 'pointer'}}
        onClick={this.handleLostPasswordClick}>
        Mot de passe oublié ?
      </a>}
      {passwordResetRequestedEmail ?
        <span style={lostPasswordLinkStyle}>
          Un email a été envoyé à {passwordResetRequestedEmail}
        </span>
        : <Button
          disabled={!this.isFormValid() || isAuthenticatingOther || isAuthenticatingEmail}
          onClick={handleSubmit}
          style={{alignSelf: 'center', marginTop: 30}}
          isNarrow={true}
          isProgressShown={(isAuthenticatingEmail || isAskingForPasswordReset)}
          type="validation">
          {isTryingToResetPassword ? 'Récupérer son mot de passe' : "S'identifier"}
        </Button>}
    </form>
  }
}
const LoginForm =
  connect(({asyncState: {authMethod, isFetching}}: RootState): LoginConnectedProps => ({
    isAskingForPasswordReset: isFetching['RESET_USER_PASSWORD'],
    isAuthenticatingEmail:
      isFetching['EMAIL_CHECK'] || isFetching['AUTHENTICATE_USER'] && authMethod === 'password',
    isAuthenticatingOther: isFetching['AUTHENTICATE_USER'] && authMethod !== 'password',
  }))(LoginFormBase)


interface ResetPasswordConnectedProps {
  hasTokenExpired: boolean
  isAuthenticating: boolean
}

interface ResetPasswordProps extends ResetPasswordConnectedProps {
  defaultEmail?: string
  dispatch: DispatchAllActions
  inputRef?: React.RefObject<IconInput>
  isEmailShown: boolean
  isTitleShown: boolean
  onLogin: (user: bayes.bob.User) => void
  resetToken?: string
  style?: React.CSSProperties
}

interface ResetPasswordState {
  email?: string
  hashSalt?: string
  oldPassword?: string
  password?: string
  passwordResetRequestedEmail?: string
}

// TODO(cyrille): Check whether the token has expired on mount, to avoid having the expiration error
// after the user has entered their new password.
class ResetPasswordFormBase extends React.PureComponent<ResetPasswordProps, ResetPasswordState> {
  public static propTypes = {
    defaultEmail: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    hasTokenExpired: PropTypes.bool.isRequired,
    isAuthenticating: PropTypes.bool,
    isTitleShown: PropTypes.bool.isRequired,
    onLogin: PropTypes.func.isRequired,
    resetToken: PropTypes.string,
    style: PropTypes.object,
  }

  public static defaultProps = {
    isEmailShown: true,
    isTitleShown: true,
  }

  public state: ResetPasswordState = {
    email: this.props.defaultEmail || '',
    oldPassword: '',
    password: '',
  }

  public componentDidMount(): void {
    const {defaultEmail, dispatch, resetToken} = this.props
    if (!resetToken && defaultEmail) {
      dispatch(emailCheck(defaultEmail)).
        then((response): bayes.bob.AuthResponse|void => {
          if (response && response.hashSalt) {
            this.setState({hashSalt: response.hashSalt})
          }
          return response
        })
    }
  }

  private handleEmailChange = (email: string): void => this.setState({email})

  private handleOldPasswordChange = (oldPassword: string): void => this.setState({oldPassword})

  private handlePasswordChange = (password: string): void => this.setState({password})

  private handleResetPassword = (): void => {
    if (!this.isFormValid()) {
      return
    }
    const {email, hashSalt, oldPassword, password} = this.state
    const {dispatch, onLogin, resetToken} = this.props

    if (!email) {
      return
    }

    if (resetToken && password) {
      dispatch(resetPassword(email, password, resetToken)).
        then((response): void => {
          if (response && response.authenticatedUser) {
            onLogin(response.authenticatedUser)
          }
        })
      return
    }

    if (oldPassword && hashSalt && password) {
      dispatch(changePassword(email, oldPassword, hashSalt, password)).
        then((response): void => {
          if (response && response.isPasswordUpdated && response.authenticatedUser) {
            onLogin(response.authenticatedUser)
          }
        })
    }
  }

  private handleResetPasswordForm = (event): void => {
    event.preventDefault()
    this.handleResetPassword()
  }

  private handleResendEmail = (): void => {
    const {email} = this.state
    if (!email) {
      return
    }
    this.props.dispatch(askPasswordReset(email)).then((response): void => {
      if (response) {
        this.setState({passwordResetRequestedEmail: email})
      }
    })
  }

  private isFormValid = (): boolean => {
    const {resetToken} = this.props
    const {email, oldPassword, password} = this.state
    return !!(password && validateEmail(email) && (resetToken || oldPassword))
  }

  private renderExpiredToken(): React.ReactNode {
    const {passwordResetRequestedEmail} = this.state
    const emailSentStyle = {
      fontStyle: 'italic',
      marginTop: 10,
    }
    return <div>
      <FormHeader title="Moyen d'authentification périmé" />
      Le lien que vous avez utilisé est trop vieux.
      Veuillez vous <LoginLink visualElement="expired-resetToken">reconnecter</LoginLink> ou{' '}
      <a href="#" onClick={this.handleResendEmail}>cliquer ici</a> pour réinitialiser votre
      mot de passe.
      {passwordResetRequestedEmail ? <div style={emailSentStyle}>
        Un email a été envoyé à {passwordResetRequestedEmail}
      </div> : null}
    </div>
  }

  public render(): React.ReactNode {
    const {inputRef, hasTokenExpired, isAuthenticating, isTitleShown, resetToken,
      style} = this.props
    if (hasTokenExpired) {
      return this.renderExpiredToken()
    }
    const {email, oldPassword, password} = this.state
    const loginBoxStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      marginTop: 15,
      ...style,
    }
    return <form style={loginBoxStyle} onSubmit={this.handleResetPasswordForm}>
      {isTitleShown ? <FormHeader title="Changez votre mot de passe" /> : null}
      {resetToken ? <IconInput
        iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
        shouldFocusOnMount={!email} autoComplete="email"
        type="email" placeholder="Email" value={email} iconComponent={EmailOutlineIcon}
        applyFunc={toLocaleLowerCase}
        onChange={this.handleEmailChange} /> : <IconInput
        iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
        type="password" autoComplete="password" shouldFocusOnMount={true}
        placeholder="Mot de passe actuel" value={oldPassword} iconComponent={LockOutlineIcon}
        onChange={this.handleOldPasswordChange} ref={inputRef} />}
      <IconInput
        iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
        type="password" autoComplete="new-password" shouldFocusOnMount={!!email}
        placeholder="Nouveau mot de passe" value={password} iconComponent={LockOutlineIcon}
        onChange={this.handlePasswordChange}
        style={{marginTop: 10}} ref={resetToken ? inputRef : undefined} />
      <Button
        disabled={!this.isFormValid()}
        onClick={this.handleResetPassword}
        style={{alignSelf: 'center', marginTop: 30}}
        isProgressShown={isAuthenticating}
        isNarrow={true}
        type="validation">
        Changer le mot de passe
      </Button>
    </form>
  }
}
const ResetPasswordForm = connect(
  ({app: {hasTokenExpired}, asyncState: {isFetching}}: RootState): ResetPasswordConnectedProps => ({
    hasTokenExpired: !!hasTokenExpired,
    isAuthenticating: !!(isFetching['EMAIL_CHECK'] || isFetching['AUTHENTICATE_USER']),
  }))(ResetPasswordFormBase)


interface RegistrationConnectedProps {
  defaultEmail: string
  hasUser?: boolean
  isAuthenticating: boolean
  shouldRequestNames?: boolean
}

interface RegistrationProps extends RegistrationConnectedProps {
  dispatch: DispatchAllActions
  onLogin: (user: bayes.bob.User) => void
  onShowLoginFormClick: () => void
  stateToStore: StoredState
  storedState?: StoredState
}

interface RegistrationState {
  email: string
  hasAcceptedTerms: boolean
  lastName: string
  name: string
  password: string
}

class RegistrationFormBase extends React.PureComponent<RegistrationProps, RegistrationState> {
  public static propTypes = {
    defaultEmail: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    hasUser: PropTypes.bool,
    isAuthenticating: PropTypes.bool,
    onLogin: PropTypes.func.isRequired,
    onShowLoginFormClick: PropTypes.func.isRequired,
    shouldRequestNames: PropTypes.bool,
  }

  public state: RegistrationState = {
    email: this.props.defaultEmail,
    hasAcceptedTerms: !!this.props.hasUser,
    lastName: '',
    name: '',
    password: '',
  }

  private handleNameChange = (name: string): void => this.setState({name})

  private handleLastNameChange = (lastName: string): void => this.setState({lastName})

  private handleEmailChange = (email: string): void => this.setState({email})

  private handlePasswordChange = (password: string): void => this.setState({password})

  private handleRegister = (): void => {
    if (!this.isFormValid()) {
      return
    }
    const {email, password, name, lastName} = this.state
    const {dispatch, onLogin, onShowLoginFormClick} = this.props
    dispatch(registerNewUser(email, password, name, lastName)).
      then((response): bayes.bob.AuthResponse | void => {
        if (!response) {
          return response
        }
        // TODO: Handle this more explicitly after switch to two endpoints.
        // User already exists
        if (!response.authenticatedUser) {
          dispatch(displayToasterMessage(
            'Ce compte existe déjà, merci de vous connecter avec vos identifiants'))
          onShowLoginFormClick()
          return
        }
        onLogin(response.authenticatedUser)
        return response
      })
  }

  private handleToggleAcceptTerms = (): void =>
    this.setState(({hasAcceptedTerms}: RegistrationState):
    Pick<RegistrationState, 'hasAcceptedTerms'> => ({hasAcceptedTerms: !hasAcceptedTerms}))

  private isFormValid = (): boolean => {
    const {shouldRequestNames} = this.props
    const {email, hasAcceptedTerms, password, lastName, name} = this.state
    return !!(hasAcceptedTerms && password && validateEmail(email) &&
      (!shouldRequestNames || (lastName && name)))
  }

  private fastForward = (): void => {
    const {email, hasAcceptedTerms, password, lastName, name} = this.state
    if (this.isFormValid()) {
      this.handleRegister()
      return
    }
    const {shouldRequestNames} = this.props
    // TODO(marielaure) Clean when launching Late Sign Up.
    if (!shouldRequestNames && hasAcceptedTerms) {
      this.setState({
        email: email || getUniqueExampleEmail(),
        password: password || 'password',
      })
      return
    }
    this.setState({
      email: email || getUniqueExampleEmail(),
      hasAcceptedTerms: true,
      lastName: lastName || 'Dupont',
      name: name || 'Angèle',
      password: password || 'password',
    })
  }

  public render(): React.ReactNode {
    const {email, hasAcceptedTerms, password, name, lastName} = this.state
    const {isAuthenticating, hasUser, onLogin, shouldRequestNames,
      stateToStore, storedState} = this.props
    const registrationBoxStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      marginTop: 15,
    }
    // TODO(marielaure) Clean when launching Late Sign Up.
    return <form style={registrationBoxStyle} onSubmit={this.handleRegister}>
      <FastForward onForward={this.fastForward} />
      <FormHeader
        title="Créer un compte"
        question="Déjà un compte ?"
        linkText="Connectez-vous !"
        onClick={this.props.onShowLoginFormClick} />

      <SocialLoginButtons
        stateToStore={stateToStore} storedState={storedState} onLogin={onLogin} isNewUser={true} />

      <FormSection title="Inscription par mot de passe">
        {shouldRequestNames ? <React.Fragment>
          <IconInput
            iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
            shouldFocusOnMount={true} autoComplete="given-name"
            type="text" placeholder="Prénom" value={name} iconComponent={AccountOutlineIcon}
            onChange={this.handleNameChange} />
          <IconInput
            iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
            type="text" placeholder="Nom" value={lastName} iconComponent={AccountOutlineIcon}
            onChange={this.handleLastNameChange} autoComplete="family-name"
            style={{marginTop: 10}} />
        </React.Fragment> : null}
        <IconInput
          iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
          type="email" placeholder="Email" value={email} iconComponent={EmailOutlineIcon}
          applyFunc={toLocaleLowerCase} autoComplete="email"
          onChange={this.handleEmailChange}
          style={{marginTop: 10}} />
        <IconInput
          iconStyle={{fill: colors.PINKISH_GREY, width: 20}}
          type="password" autoComplete="new-password"
          placeholder="Créer un mot de passe" value={password} iconComponent={LockOutlineIcon}
          onChange={this.handlePasswordChange}
          style={{marginTop: 10}} />
      </FormSection>

      <div style={{fontSize: 12, margin: '10px auto 0', maxWidth: 325}}>
        Nous sommes une association loi 1901 à but non lucratif&nbsp;:
        {' '}{config.productName} est <strong>gratuit</strong> et le restera
        toujours.
      </div>
      {hasUser ? null : <LabeledToggle
        type="checkbox" label={<span>
            J'ai lu et j'accepte les <Link
            to={Routes.TERMS_AND_CONDITIONS_PAGE} target="_blank" rel="noopener noreferrer"
            onClick={stopPropagation}>
              conditions générales d'utilisation
          </Link>
        </span>}
        style={{fontSize: 12, marginTop: 10}}
        isSelected={hasAcceptedTerms}
        onClick={this.handleToggleAcceptTerms} />}
      <Button
        disabled={!this.isFormValid()}
        onClick={this.handleRegister}
        style={{alignSelf: 'center', marginTop: 30}}
        isNarrow={true}
        isProgressShown={isAuthenticating}
        type="validation">
        S'inscrire
      </Button>
    </form>
  }
}
const RegistrationForm = connect(({app, asyncState, user}: RootState):
RegistrationConnectedProps => {
  const {
    profile: {name = undefined} = {},
    userId = undefined,
  } = user
  const {email = ''} = app.loginModal && app.loginModal.defaultValues || {}
  return {
    defaultEmail: email,
    hasUser: !!userId,
    isAuthenticating: !!asyncState.isFetching['AUTHENTICATE_USER'],
    shouldRequestNames: !name,
  }
})(RegistrationFormBase)


interface SectionProps {
  title: React.ReactNode
}

class FormSection extends React.PureComponent<SectionProps> {
  public static propTypes = {
    children: PropTypes.node,
    title: PropTypes.node.isRequired,
  }

  public render(): React.ReactNode {
    const {children, title} = this.props
    const titleStyle: React.CSSProperties = {
      color: colors.GREYISH_BROWN,
      fontSize: 14,
      margin: '30px 0 15px',
      textAlign: 'center',
    }
    return <React.Fragment>
      <div style={titleStyle}>
        {title}
      </div>
      {children}
    </React.Fragment>
  }
}


interface HeaderProps {
  linkText?: string
  onClick?: () => void
  question?: string
  title: string
}


class FormHeader extends React.PureComponent<HeaderProps> {
  public static propTypes = {
    linkText: PropTypes.string,
    onClick: PropTypes.func,
    question: PropTypes.string,
    title: PropTypes.string.isRequired,
  }

  public render(): React.ReactNode {
    const {linkText, onClick, question, title} = this.props
    const headlineStyle: React.CSSProperties = {
      color: colors.DARK_TWO,
      fontSize: 23,
      fontWeight: 500,
      lineHeight: 1.6,
      textAlign: 'center',
    }
    const contentStyle: React.CSSProperties = {
      fontSize: 14,
      lineHeight: 1.4,
      textAlign: 'center',
    }
    const linkStyle: React.CSSProperties = {
      color: colors.BOB_BLUE,
      cursor: 'pointer',
      textDecoration: 'underline',
    }
    return <div style={{marginBottom: 20}}>
      <div style={headlineStyle}>{title}</div>
      {question && onClick && linkStyle && linkText ? <div style={contentStyle}>
        <span>{question} </span>
        <span onClick={onClick} style={linkStyle}>{linkText}</span>
      </div> : null}
    </div>
  }
}


function getLocalStorageKey(state: string): string {
  return `oauth2.${state}`
}


function getRandomHash(): string {
  return (Math.random() * 36).toString(36)
}


interface StoredState {
  clientId?: string
  location?: string
  isNewUser?: boolean
  nonce?: string
}

function setStoredState(state: StoredState, stateKey?: string): [string, StoredState] {
  const storedState = {
    ...state,
    nonce: getRandomHash(),
  }
  stateKey = stateKey || getRandomHash()
  Storage.setItem(getLocalStorageKey(stateKey), JSON.stringify(storedState))
  return [stateKey, storedState]
}


function getStoredState(state: string): StoredState|null {
  const stateKey = getLocalStorageKey(state)
  const stateContent = Storage.getItem(stateKey)
  if (!stateContent) {
    return null
  }
  Storage.removeItem(stateKey)
  return JSON.parse(stateContent)
}

interface OAuth2Props extends React.HTMLProps<HTMLButtonElement> {
  authorizeEndpoint: string
  authorizeParams?: {[param: string]: string}
  clientId: string
  isNewUser?: boolean
  logo: string
  onFailure?: (error: {message: string}) => void
  onSuccess?: (auth: {code?: string; nonce?: string}) => void
  scopes?: string[]
  stateToStore?: StoredState
  storedState?: StoredState
  style?: React.CSSProperties
}

class OAuth2ConnectLogin extends React.PureComponent<OAuth2Props> {
  public static propTypes = {
    authorizeEndpoint: PropTypes.string.isRequired,
    authorizeParams: PropTypes.objectOf(PropTypes.string.isRequired),
    children: PropTypes.node,
    clientId: PropTypes.string.isRequired,
    logo: PropTypes.string.isRequired,
    onFailure: PropTypes.func,
    onSuccess: PropTypes.func,
    scopes: PropTypes.arrayOf(PropTypes.string.isRequired),
    stateToStore: PropTypes.shape({
      isNewUser: PropTypes.bool,
      location: PropTypes.string,
    }),
    storedState: PropTypes.shape({
      clientId: PropTypes.string.isRequired,
      nonce: PropTypes.string,
    }),
    style: PropTypes.object,
  }

  public componentDidMount(): void {
    this.connectFromState()
  }

  public componentDidUpdate({storedState}: OAuth2Props): void {
    if (!storedState && this.props.storedState) {
      this.connectFromState()
    }
  }

  private connectFromState(): void {
    const {clientId, onFailure, onSuccess, storedState} = this.props
    // TODO(cyrille): Rather use withRouter
    const {search} = window.location
    if (!search || !storedState) {
      return
    }
    const {clientId: storedClientId, nonce} = storedState
    if (storedClientId !== clientId) {
      return
    }
    const {code, error, error_description: errorDescription, state} = parse(search.slice(1))
    if (!nonce) {
      onFailure && onFailure(new Error(`Invalid state: "${state}".`))
      return
    }
    if (error || !code) {
      if (/(user cancelled|owner did not authorize)/i.test(errorDescription)) {
        // User cancelled their request so they are aware of what happened.
        onFailure && onFailure(new Error('Authentification annulée'))
        return
      }
      onFailure && onFailure(new Error(
        errorDescription || error || "Erreur lors de l'authentification, code manquant"))
      return
    }
    onSuccess && onSuccess({code, nonce})
  }

  private startSigninFlow = (): void => {
    const {authorizeEndpoint, authorizeParams, clientId, scopes, stateToStore} = this.props
    const [state, {nonce}] = setStoredState({...stateToStore, clientId})
    const {host, protocol} = window.location
    const redirectUri = `${protocol}//${host}${Routes.ROOT}`
    const url = `${authorizeEndpoint}?${stringify({
      'client_id': clientId,
      nonce,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      state,
      ...(scopes ? {scope: scopes.join(' ')} : {}),
      ...authorizeParams,
    })}`
    window.location.href = url
  }

  public render(): React.ReactNode {
    const {children, logo, style,
      authorizeEndpoint: omittedEndPoint, authorizeParams: omittedParams, clientId: omittedId,
      isNewUser: omittedIsNewUser, onFailure: omittedOnFailure, onSuccess: omittedOnSuccess,
      scopes: omittedScopes, stateToStore: omittedStateToStore, storedState: omittedStoredState,
      ...extraProps} = this.props
    const buttonStyle: React.CSSProperties = {
      padding: '5px 10px',
      ...style,
    }
    const imageStyle: React.CSSProperties = {
      height: 31,
      marginRight: 10,
      verticalAlign: 'middle',
      width: 34,
    }
    return <button {...extraProps} onClick={this.startSigninFlow} style={buttonStyle} type="button">
      <img style={imageStyle} src={logo} alt="Icône Pôle emploi" />
      {children}
    </button>
  }
}


interface ModalConnectedProps {
  isLoginFormShownByDefault: boolean
  isShown: boolean
  resetToken: string
}

interface ModalProps extends ModalConnectedProps {
  dispatch: DispatchAllActions
}

interface ModalState {
  isShown: boolean
  isShownAsFullPage: boolean
}

class LoginModalBase extends React.PureComponent<ModalProps, ModalState> {
  public static propTypes = {
    dispatch: PropTypes.func.isRequired,
    isLoginFormShownByDefault: PropTypes.bool,
    isShown: PropTypes.bool,
    resetToken: PropTypes.string,
  }

  public state: ModalState = {
    isShown: false,
    isShownAsFullPage: false,
  }

  public static getDerivedStateFromProps(nextProps: ModalProps, {isShown: wasShown}: ModalState):
  Partial<ModalState>|null {
    const {isLoginFormShownByDefault, isShown, resetToken} = nextProps
    const wantShown = isShown || !!resetToken
    if (wantShown === wasShown) {
      return null
    }
    const newState = {
      isShown: wantShown,
      ...wantShown && {
        isShownAsFullPage: !isMobileVersion && !resetToken && !isLoginFormShownByDefault,
      },
    }
    return newState
  }

  private handleClose = (): void => {
    this.props.dispatch(closeLoginModal())
  }

  // TODO(marielaure): Put a carousel for cover image.
  private renderIntro(style: React.CSSProperties): React.ReactNode {
    const containerStyle: React.CSSProperties = {
      minHeight: '100vh',
      position: 'relative',
      zIndex: 0,
      ...style,
    }
    const coverAll: React.CSSProperties = {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    }
    const coverImageStyle: React.CSSProperties = {
      ...coverAll,
      backgroundImage: `url(${chooseImageVersion(portraitCoverImage, isMobileVersion)})`,
      backgroundPosition: 'center, center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      zIndex: -2,
    }
    const portraitQuoteStyle: React.CSSProperties = {
      bottom: 0,
      fontSize: 18,
      lineHeight: 1.44,
      margin: '60px 50px',
      position: 'absolute',
    }
    const coverShadeStyle: React.CSSProperties = {
      ...coverAll,
      backgroundColor: colors.BOB_BLUE,
      opacity: .8,
      zIndex: -1,
    }

    return <div style={containerStyle}>
      <div
        style={{...coverShadeStyle, background: 'linear-gradient(to bottom, transparent, #000)'}} />
      <div style={coverImageStyle} />
      <div>
        <img
          style={{height: 30, marginLeft: 60, marginTop: 30}}
          src={logoProductImage} alt={config.productName} />
        <div style={portraitQuoteStyle}>
          <div style={{color: '#fff', fontStyle: 'italic', maxWidth: 360}}>
            «&nbsp;{config.productName} a provoqué l'étincelle chez moi. J'ai
            compris qu'il fallait que je me tourne prioritairement vers des entreprises
            qui me plaisent et que je mobilise plus activement mon réseau.&nbsp;»
          </div>
          <div style={{color: colors.WARM_GREY, marginTop: 25}}>Catherine, 37 ans</div>
        </div>
      </div>
    </div>
  }

  public render(): React.ReactNode {
    const {resetToken} = this.props
    const {isShownAsFullPage} = this.state

    const containerStyle: React.CSSProperties = isShownAsFullPage ? {
      alignItems: 'center',
      borderRadius: 0,
      display: 'flex',
      transition: 'none',
      width: '100vw',
    } : {
      width: isMobileVersion ? 'initial' : 400,
    }
    const closeButtonStyle: RadiumCSSProperties = {
      ':hover': {
        opacity: .9,
      },
      boxShadow: 'initial',
      opacity: .6,
      right: 50,
      top: 50,
      transform: 'initial',
    }

    return <Modal
      isShown={this.state.isShown || !!resetToken} style={containerStyle}
      onClose={(resetToken || isShownAsFullPage) ? undefined : this.handleClose}>
      {isShownAsFullPage ? this.renderIntro({flex: .5}) : null}
      {isShownAsFullPage ?
        <ModalCloseButton onClick={this.handleClose} style={closeButtonStyle} /> : null}
      <LoginMethods onFinish={this.handleClose} />
    </Modal>
  }
}
const LoginModal = connect(({app: {loginModal}}: RootState): ModalConnectedProps => {
  const {isReturningUser = false, resetToken = ''} = loginModal && loginModal.defaultValues || {}
  return {
    isLoginFormShownByDefault: !!isReturningUser,
    // TODO(cyrille): Clean this up, since modal is never rendered if !loginModal.
    isShown: !!loginModal,
    resetToken,
  }
})(LoginModalBase)


interface MethodsConfig {
  forwardLocation?: string
  onFinish?: () => void
  onLogin?: (user: bayes.bob.User) => void
}

interface MethodsConnectedProps {
  defaultEmail: string
  forwardLocation: string
  isLoginFormShownByDefault: boolean
  resetToken: string
}

type MethodsProps = MethodsConnectedProps & MethodsConfig & RouteComponentProps

interface MethodsState {
  forwardLocation?: string
  isLoginFormShown: boolean
  state?: string
  storedState?: StoredState
}

class LoginMethodsBase extends React.PureComponent<MethodsProps, MethodsState> {
  public static propTypes = {
    defaultEmail: PropTypes.string,
    forwardLocation: PropTypes.string,
    isLoginFormShownByDefault: PropTypes.bool,
    onFinish: PropTypes.func,
    onLogin: PropTypes.func,
    resetToken: PropTypes.string,
  }

  public state: MethodsState = {
    forwardLocation: this.props.forwardLocation,
    isLoginFormShown: this.props.isLoginFormShownByDefault,
  }

  public static getDerivedStateFromProps(
    {location: {search}}: MethodsProps, {state: prevState}: MethodsState): null | MethodsState {
    if (!search) {
      return null
    }
    const {state} = parse(search)
    if (!state || state === prevState) {
      return null
    }
    const storedState = getStoredState(state)
    if (!storedState) {
      return null
    }
    return {
      forwardLocation: storedState.location,
      isLoginFormShown: !storedState.isNewUser,
      state,
      storedState,
    }
  }

  private handleActualLogin = (user: bayes.bob.User): void => {
    const {history, location: {pathname}, onFinish, onLogin} = this.props
    const {storedState: {location = undefined} = {}} = this.state
    onLogin && onLogin(user)
    onFinish && onFinish()
    if (location && pathname !== location) {
      history.push(location)
    }
  }


  private handleShowLoginForm = _memoize((isLoginFormShown): (() => void) =>
    (): void => this.setState({isLoginFormShown}))

  public render(): React.ReactNode {
    const {defaultEmail, resetToken} = this.props
    const {isLoginFormShown, forwardLocation, storedState} = this.state
    const actionBoxStyle: React.CSSProperties = {
      alignItems: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      flexDirection: 'column',
      padding: '30px 20px',
    }
    const stateToStore = {isNewUser: !isLoginFormShown, location: forwardLocation}
    let form
    if (resetToken) {
      form = <ResetPasswordForm
        defaultEmail={defaultEmail} onLogin={this.handleActualLogin} resetToken={resetToken} />
    } else if (isLoginFormShown) {
      form = <LoginForm
        onLogin={this.handleActualLogin} defaultEmail={defaultEmail}
        stateToStore={stateToStore} storedState={storedState}
        onShowRegistrationFormClick={this.handleShowLoginForm(false)} />
    } else {
      form = <RegistrationForm
        onLogin={this.handleActualLogin} stateToStore={stateToStore} storedState={storedState}
        onShowLoginFormClick={this.handleShowLoginForm(true)} />
    }
    // TODO(pascal): Simplify and cleanup styling here.
    return <div style={{flex: 1, ...Styles.CENTERED_COLUMN}}>
      <div style={actionBoxStyle}>
        {form}
      </div>
    </div>
  }
}
const LoginMethods: React.ComponentType<MethodsConfig> = withRouter(connect(
  (
    {app: {loginModal}}: RootState,
    {forwardLocation, location: {pathname}}: MethodsConfig & RouteComponentProps
  ): MethodsConnectedProps => {
    const {email = '', isReturningUser = false, resetToken = ''} = loginModal &&
      loginModal.defaultValues || {}
    return {
      defaultEmail: email,
      forwardLocation: forwardLocation || pathname,
      isLoginFormShownByDefault: !!isReturningUser,
      resetToken,
    }
  })(LoginMethodsBase))


const circularProgressStyle: React.CSSProperties = {
  color: '#fff',
  display: 'inline-block',
  textAlign: 'center',
  verticalAlign: 'middle',
  width: 170,
}

interface GoogleButtonProps {
  isAuthenticating?: boolean
  onClick: () => void
}

class GoogleButton extends React.PureComponent<GoogleButtonProps> {
  public static propTypes = {
    isAuthenticating: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
  }

  public render(): React.ReactNode {
    const {isAuthenticating, onClick} = this.props
    const googleIconStyle: React.CSSProperties = {
      height: 24,
      marginRight: 10,
      verticalAlign: 'middle',
      width: 34,
    }
    return <button className="login google-login" onClick={onClick}>
      <GoogleIcon style={googleIconStyle} />{isAuthenticating ?
        <CircularProgress size={23} style={circularProgressStyle} thickness={2} /> :
        'Se connecter avec Google'}
    </button>
  }
}

interface StatefulFacebookLoginProps extends ReactFacebookLoginProps {
  stateToStore?: StoredState
  storedState?: StoredState
}

class StatefulFacebookLogin extends
  React.PureComponent<StatefulFacebookLoginProps, {stateKey: string}> {
  public state = {
    stateKey: getRandomHash(),
  }

  public componentWillUnmount(): void {
    clearTimeout(this.timeout)
  }

  private timeout?: number

  private handleClick = (event): void => {
    const {appId, onClick, stateToStore} = this.props
    if (isMobileVersion) {
      setStoredState({...stateToStore, clientId: appId}, this.state.stateKey)
      // Prepare a new stateKey for the next time the button is clicked.
      this.timeout = window.setTimeout((): void => this.setState({stateKey: getRandomHash()}), 100)
    }
    onClick && onClick(event)
  }

  // TODO(cyrille): Remove callback hack once react-facebook-login has fixed
  // https://github.com/keppelen/react-facebook-login/issues/262.
  public render(): React.ReactNode {
    const {appId, callback, storedState: {clientId = ''} = {},
      ...otherProps} = this.props
    const {stateKey} = this.state
    const {protocol, host} = window.location
    const redirectUri = `${protocol}//${host}${Routes.ROOT}`
    return <FacebookLogin
      {...otherProps} appId={appId} redirectUri={redirectUri} state={stateKey}
      callback={clientId === appId || !clientId ? callback : noOp} onClick={this.handleClick} />
  }
}


interface SocialButtonConnectedProps {
  authMethod?: string
  isAuthenticating?: boolean
}

interface SocialButtonProps extends SocialButtonConnectedProps {
  dispatch: DispatchAllActions
  isNewUser?: boolean
  onLogin: ((user: bayes.bob.User) => void)
  returningClientId?: string
  returningNonce?: string
  stateToStore?: StoredState
  storedState?: StoredState
  style?: React.CSSProperties
}

class SocialLoginButtonsBase extends React.PureComponent<SocialButtonProps> {
  public static propTypes = {
    authMethod: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    isAuthenticating: PropTypes.bool,
    isNewUser: PropTypes.bool,
    onLogin: PropTypes.func.isRequired,
    style: PropTypes.object,
  }

  private handleAuthResponse = (response: bayes.bob.AuthResponse | void): void => {
    if (!response) {
      return
    }
    const {dispatch, isNewUser: wantsNewUser, onLogin} = this.props
    const {authenticatedUser, isNewUser} = response
    if (!authenticatedUser) {
      return
    }
    if (isNewUser && !wantsNewUser) {
      dispatch(displayToasterMessage("Création d'un nouveau compte"))
    } else if (!isNewUser && wantsNewUser) {
      dispatch(displayToasterMessage('Connexion avec le compte existant'))
    }
    // TODO(pascal): Make sure we go to /confidentialite page on first registration.
    onLogin(authenticatedUser)
  }

  private handleFacebookLogin = (facebookAuth): void => {
    // The facebookAuth object contains:
    //  - the email address: email
    //  - the facebook user ID: userID
    //  - the full name: name
    //  - the URL of a profile picture: picture.data.url
    const email = facebookAuth && facebookAuth.email
    if (email) {
      this.props.dispatch(facebookAuthenticateUser(facebookAuth)).then(this.handleAuthResponse)
    }
  }

  private handleGoogleLogin = (googleAuth): void => {
    // The googleAuth object contains the profile in getBasicProfile()
    //  - the Google ID: getId()
    //  - the email address: getEmail()
    //  - the first name: getGivenName()
    //  - the last name: getFamilyName()
    //  - the full name: getName()
    //  - the URL of a profile picture: getImageUrl()
    const email = googleAuth && googleAuth.getBasicProfile().getEmail()
    if (email) {
      this.props.dispatch(googleAuthenticateUser(googleAuth)).then(this.handleAuthResponse)
    }
  }

  private handleGoogleFailure = ({details}): void => {
    const {dispatch} = this.props
    dispatch(displayToasterMessage(details))
  }

  private handleConnectFailure = (error): void => {
    const {dispatch} = this.props
    dispatch(displayToasterMessage(error.message))
  }

  private handlePEConnectLogin = ({code, nonce}): void => {
    this.props.dispatch(peConnectAuthenticateUser(code, nonce)).then(this.handleAuthResponse)
  }

  private handleLinkedinLogin = ({code}): void => {
    this.props.dispatch(linkedInAuthenticateUser(code)).then(this.handleAuthResponse)
  }

  private renderGoogleButton = _memoize((isGoogleAuthenticating: boolean):
  ((props: GoogleButtonProps) => React.ReactElement) => (props): React.ReactElement =>
    <GoogleButton isAuthenticating={isGoogleAuthenticating} {...props} />)

  public render(): React.ReactNode {
    const {authMethod, isAuthenticating, stateToStore, storedState, style} = this.props
    const socialLoginBox: React.CSSProperties = {
      ...style,
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      fontSize: 15,
    }
    const circularProgress = <CircularProgress
      size={23} style={circularProgressStyle} thickness={2} />
    return <div style={socialLoginBox}>
      <StatefulFacebookLogin
        appId={config.facebookSSOAppId} language="fr" isDisabled={isAuthenticating}
        callback={this.handleFacebookLogin}
        fields="email,name,picture,gender,birthday"
        storedState={storedState}
        size="small" icon="fa-facebook" stateToStore={stateToStore}
        textButton={isAuthenticating && authMethod === 'facebook' ?
          // react-facebook-login expects a string. Beware on lib update.
          circularProgress as unknown as string : 'Se connecter avec Facebook'}
        cssClass="login facebook-login" />
      <GoogleLogin
        clientId={config.googleSSOClientId} disabled={isAuthenticating}
        onSuccess={this.handleGoogleLogin}
        onFailure={this.handleGoogleFailure}
        render={this.renderGoogleButton(!!isAuthenticating && authMethod === 'google')} />
      <OAuth2ConnectLogin
        authorizeEndpoint="https://authentification-candidat.pole-emploi.fr/connexion/oauth2/authorize"
        scopes={PE_CONNECT_SCOPES}
        authorizeParams={{realm: '/individu'}} disabled={isAuthenticating}
        clientId={config.emploiStoreClientId} stateToStore={stateToStore} storedState={storedState}
        className="login pe-connect-login"
        logo={peConnectIcon}
        onSuccess={this.handlePEConnectLogin}
        onFailure={this.handleConnectFailure}>
        {isAuthenticating && authMethod === 'peConnect' ?
          circularProgress : <React.Fragment>Se connecter avec pôle emploi</React.Fragment>}
      </OAuth2ConnectLogin>
      <OAuth2ConnectLogin
        clientId={config.linkedInClientId} disabled={isAuthenticating} stateToStore={stateToStore}
        authorizeEndpoint="https://www.linkedin.com/oauth/v2/authorization"
        scopes={LINKEDIN_SCOPES} storedState={storedState}
        onSuccess={this.handleLinkedinLogin}
        onFailure={this.handleConnectFailure}
        logo={linkedInIcon} style={{marginBottom: 0}}
        className="login linkedin-login">
        {isAuthenticating && authMethod === 'linkedIn' ?
          circularProgress : <React.Fragment>Se connecter avec LinkedIn</React.Fragment>}
      </OAuth2ConnectLogin>
    </div>
  }
}
const SocialLoginButtons = connect(({asyncState: {authMethod, isFetching}}: RootState):
SocialButtonConnectedProps => ({
  authMethod,
  isAuthenticating: isFetching['EMAIL_CHECK'] || isFetching['AUTHENTICATE_USER'],
}))(SocialLoginButtonsBase)


interface LinkConfig {
  email?: string
  isSignUp?: boolean
  style?: React.CSSProperties
  visualElement: string
}

interface LinkConnectedProps {
  isGuest?: boolean
  isRegisteredUser?: boolean
}

interface LoginLinkProps extends LinkConfig, LinkConnectedProps, RouteComponentProps {
  children: React.ReactNode
  dispatch: DispatchAllActions
  innerRef?: React.RefObject<HTMLAnchorElement>
}

class LoginLinkBase extends React.PureComponent<LoginLinkProps> {
  public static propTypes = {
    children: PropTypes.node,
    dispatch: PropTypes.func.isRequired,
    email: PropTypes.string,
    isGuest: PropTypes.bool,
    isRegisteredUser: PropTypes.bool,
    isSignUp: PropTypes.bool,
    style: PropTypes.object,
    visualElement: PropTypes.string.isRequired,
  }

  private handleClick = (): void => {
    const {email, isGuest, isRegisteredUser, isSignUp, dispatch, visualElement} = this.props
    if (isRegisteredUser) {
      return
    }
    if (!isGuest && isSignUp) {
      dispatch(startAsGuest(visualElement))
      return
    }
    if (isSignUp) {
      dispatch(openRegistrationModal({email}, visualElement))
    } else {
      dispatch(openLoginModal({email}, visualElement))
    }
  }

  private getNewLocation(): Link['to'] {
    const {isGuest, isRegisteredUser, isSignUp, location: {pathname}} = this.props
    if (isRegisteredUser) {
      return Routes.PROJECT_PAGE
    }
    if (!isGuest && isSignUp) {
      return Routes.INTRO_PAGE
    }
    if (isMobileVersion) {
      return {
        pathname: Routes.SIGNUP_PAGE,
        state: {pathname},
      }
    }
    return null
  }

  public render(): React.ReactNode {
    const {children, innerRef, style} = this.props
    const to = this.getNewLocation()
    const commonProps = {
      children,
      onClick: this.handleClick,
      style,
    }
    if (to) {
      return <Link {...commonProps} innerRef={innerRef} to={to} />
    }
    return <a {...commonProps} href="#" ref={innerRef} />
  }
}
const LoginLink = connect(({user: {hasAccount, userId}}: RootState): LinkConnectedProps => ({
  isGuest: !!userId && !hasAccount,
  isRegisteredUser: !!userId && !!hasAccount,
}))(withRouter(LoginLinkBase))


class LoginButton extends React.PureComponent<LinkConfig & ButtonProps> {
  public render(): React.ReactNode {
    const {children, email, isSignUp, style, visualElement, ...otherProps} = this.props
    return <LoginLink {...{email, isSignUp, style, visualElement}}>
      <Button type="deletion" {...otherProps}>{children}</Button>
    </LoginLink>
  }
}


export {LoginModal, LoginMethods, LoginLink, LoginButton, ResetPasswordForm}