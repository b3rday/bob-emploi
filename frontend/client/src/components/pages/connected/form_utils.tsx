import _range from 'lodash/range'
import _isEqual from 'lodash/isEqual'
import _memoize from 'lodash/memoize'
import _without from 'lodash/without'
import CheckIcon from 'mdi-react/CheckIcon'
import CloseIcon from 'mdi-react/CloseIcon'
import PropTypes from 'prop-types'
import React, {useMemo} from 'react'
import ReactSelect from 'react-select'

import {WithLocalizableName} from 'store/i18n'

import {isMobileVersion} from 'components/mobile'
import {LabeledToggle} from 'components/theme'

const getName = ({name}: {name: string}): string => name
const getIsDisabled = ({disabled}: {disabled?: boolean}): boolean => !!disabled


interface CheckboxListProps<T> {
  checkboxStyle?: React.CSSProperties | ((index: number) => React.CSSProperties)
  onChange: (value: readonly T[]) => void
  options: readonly {
    name: React.ReactNode
    value: T
  }[]
  selectedCheckboxStyle?: React.CSSProperties
  style?: React.CSSProperties
  values: readonly T[] | undefined
}


const emptyArray = [] as const


interface CheckboxListState<T> {
  values: readonly T[]
  valuesSelected: Set<T>
}


class CheckboxList<T = string>
  extends React.PureComponent<CheckboxListProps<T>, CheckboxListState<T>> {
  public static propTypes = {
    onChange: PropTypes.func.isRequired,
    // The sorted list of selectable options.
    options: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.node.isRequired,
      value: PropTypes.string,
    })),
    selectedCheckboxStyle: PropTypes.object,
    style: PropTypes.object,
    values: PropTypes.arrayOf(PropTypes.string),
  }

  public state: CheckboxListState<T> = {
    values: [],
    valuesSelected: new Set(),
  }

  public static getDerivedStateFromProps<T>(
    {values = emptyArray}: CheckboxListProps<T>, {values: prevValues}: CheckboxListState<T>):
    CheckboxListState<T>|null {
    if (values === prevValues) {
      return null
    }
    return {
      values: values || emptyArray,
      valuesSelected: new Set(values),
    }
  }

  private handleChange = _memoize((optionValue: T): (() => void) => (): void => {
    const {values, valuesSelected} = this.state
    const isSelected = valuesSelected.has(optionValue)
    const newValues = isSelected ?
      _without(values, optionValue) :
      [optionValue].concat(values)
    this.props.onChange(newValues)
  })

  public render(): React.ReactNode {
    const {options, checkboxStyle, onChange: omittedOnChange, selectedCheckboxStyle,
      values: omittedValues, ...extraProps} = this.props
    const {valuesSelected} = this.state
    const labelStyle = {
      marginTop: isMobileVersion ? 10 : 0,
    }

    return <div {...extraProps}>
      {(options || []).map((option, index): React.ReactNode => {
        const isSelected = valuesSelected.has(option.value)
        return <LabeledToggle
          key={option.value + ''} label={option.name} type="checkbox"
          style={{
            ...labelStyle,
            ...(typeof checkboxStyle === 'function' ? checkboxStyle(index) : checkboxStyle),
            ...isSelected && selectedCheckboxStyle,
          }}
          isSelected={isSelected} onClick={this.handleChange(option.value)} />
      })}
    </div>
  }
}


interface FieldCheckProps {
  isMarkedInvalid?: boolean
  isValid?: boolean
  style?: React.CSSProperties
}


const fieldCheckIconStyle: React.CSSProperties = {
  fill: '#fff',
  width: 20,
}


const FieldCheckBase = (props: FieldCheckProps): React.ReactElement => {
  const {isMarkedInvalid, isValid, style} = props
  const checkboxStyle = useMemo((): React.CSSProperties => ({
    alignItems: 'center',
    backgroundColor: isMarkedInvalid ? colors.RED_PINK : colors.GREENISH_TEAL,
    borderRadius: '50%',
    bottom: 0,
    color: '#fff',
    display: 'flex',
    fontSize: 16,
    height: isMobileVersion ? 20 : 30,
    justifyContent: 'center',
    margin: 'auto',
    opacity: (!isMobileVersion && isValid) || isMarkedInvalid ? 1 : 0,
    overflow: 'hidden',
    position: 'absolute',
    right: isMobileVersion ? 30 : -10,
    top: isMobileVersion ? -70 : 0,
    transform: 'translateX(100%)',
    width: isMobileVersion ? 20 : 30,
    ...style,
  }), [style, isValid, isMarkedInvalid])
  return <div style={checkboxStyle}>
    {isMarkedInvalid ? <CloseIcon style={fieldCheckIconStyle} /> : null}
    {isValid ? <CheckIcon style={fieldCheckIconStyle} /> : null}
  </div>
}
FieldCheckBase.propTypes = {
  isMarkedInvalid: PropTypes.bool,
  isValid: PropTypes.bool,
  style: PropTypes.object,
}
const FieldCheck = React.memo(FieldCheckBase)


interface FieldSetProps {
  children: React.ReactNode
  disabled?: boolean
  hasCheck?: boolean
  hasNoteOrComment?: boolean
  isInline?: boolean
  isValid?: boolean
  isValidated?: boolean
  label?: React.ReactNode
  style?: React.CSSProperties
}


const fieldSetStyle: React.CSSProperties = {
  position: 'relative',
}


const FieldSetBase = (props: FieldSetProps): React.ReactElement => {

  const {children, disabled, hasCheck, hasNoteOrComment, isInline, isValid, isValidated, label,
    style, ...otherProps} = props
  const isMarkedInvalid = !disabled && isValidated && !isValid
  const containerStyle = useMemo((): React.CSSProperties => ({
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    fontSize: 15,
    marginBottom: hasNoteOrComment || isInline ? 0 : 25,
    marginLeft: 0,
    marginRight: 0,
    minWidth: isInline ? 'initial' : isMobileVersion ? '100%' : 360,
    opacity: disabled ? 0.5 : 'inherit',
    padding: 0,
    position: 'relative',
    ...style,
  }), [disabled, isInline, hasNoteOrComment, style])

  const labelStyle = useMemo((): React.CSSProperties => ({
    color: isInline && isMarkedInvalid ? colors.RED_PINK : colors.CHARCOAL_GREY,
    fontSize: style && style.fontSize || 15,
    lineHeight: 1.3,
    marginBottom: isInline ? 0 : 11,
  }), [style, isInline, isMarkedInvalid])

  return <fieldset
    style={containerStyle} disabled={disabled}
    className={isMarkedInvalid ? 'marked-invalid' : ''}
    {...otherProps}>
    <label style={labelStyle}>{label}</label>
    <div style={fieldSetStyle}>
      <div>
        {children}
      </div>
      {(hasCheck && isValid) || isMarkedInvalid ?
        <FieldCheck isValid={isValid} isMarkedInvalid={isMarkedInvalid} /> : null}
    </div>
  </fieldset>
}
FieldSetBase.propTypes = {
  children: PropTypes.node,
  // We keep disabled by consistency with the DOM fieldset element.
  // eslint-disable-next-line react/boolean-prop-naming
  disabled: PropTypes.bool,
  hasCheck: PropTypes.bool,
  hasNoteOrComment: PropTypes.bool,
  isInline: PropTypes.bool,
  isValid: PropTypes.bool,
  isValidated: PropTypes.bool,
  label: PropTypes.node,
  style: PropTypes.object,
}
const FieldSet = React.memo(FieldSetBase)


export interface SelectOption<T> {
  disabled?: boolean
  name: string
  value: T
}


export type LocalizedSelectOption<T> = SelectOption<T> & WithLocalizableName


type ReactSelectProps<T> = ReactSelect<T>['props']

interface SelectProps<T> extends Omit<ReactSelectProps<SelectOption<T>>, 'onChange'> {
  areUselessChangeEventsMuted?: boolean
  defaultMenuScroll?: number
  isMulti?: boolean
  onChange: ((value: T) => void) | ((value: readonly T[]) => void)
  options: readonly SelectOption<T>[]
  style?: React.CSSProperties
  value?: T | readonly T[]
}


type ReactSelectCSSProperties = React.CSSProperties & {'&:hover': React.CSSProperties}


class Select<T = string> extends React.PureComponent<SelectProps<T>> {
  public static propTypes = {
    areUselessChangeEventsMuted: PropTypes.bool.isRequired,
    // Number of options to scroll the menu when first opened.
    defaultMenuScroll: PropTypes.number,
    isMulti: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      disabled: PropTypes.bool,
      name: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })).isRequired,
    style: PropTypes.object,
    value: PropTypes.oneOfType(
      [PropTypes.string, PropTypes.number, PropTypes.arrayOf(PropTypes.string.isRequired)]),
  }

  public static defaultProps = {
    areUselessChangeEventsMuted: true,
  }

  private handleChange = (option?: SelectOption<T>|readonly SelectOption<T>[]|null): void => {
    if (!option) {
      return
    }
    const {areUselessChangeEventsMuted, isMulti, onChange, value: oldValue} = this.props
    if (isMulti) {
      const values = (option as readonly SelectOption<T>[]).
        map(({value}: SelectOption<T>): T => value)
      if (!areUselessChangeEventsMuted || !_isEqual(values, oldValue)) {
        (onChange as ((value: readonly T[]) => void))(values)
      }
      return
    }
    const {value} = option as SelectOption<T>
    if (!areUselessChangeEventsMuted || (value !== oldValue)) {
      (onChange as ((value: T) => void))(value)
    }
  }

  private subComponent: React.RefObject<ReactSelect<SelectOption<T>>> = React.createRef()

  private handleMenuOpen = (): void => {
    const {defaultMenuScroll, options, value} = this.props
    const {select = undefined} = this.subComponent && this.subComponent.current || {}
    if (!select) {
      return
    }
    // Either focus on the value or the defaultMenuScroll.
    const focusedOption = value &&
      options.findIndex(({value: thisValue}): boolean => value === thisValue) + 1 || 1 - 1 ||
      defaultMenuScroll
    if (!focusedOption) {
      return
    }
    setTimeout((): void => {
      // Hack to have the desired element at the start of the menu page.
      select.setState(
        {focusedOption: options[focusedOption - 1]},
        (): void => {
          select.focusOption('pagedown')
        },
      )
    })
  }

  private makeValueProp = (): SelectOption<T> | SelectOption<T>[] | undefined => {
    const {isMulti, options, value} = this.props
    if (isMulti) {
      return (value as T[]).
        map((v): SelectOption<T> | undefined =>
          options.find(({value: optionValue}): boolean => v === optionValue)).
        filter((v): v is SelectOption<T> => !!v)
    }
    return options.find(({value: optionValue}): boolean => value === optionValue)
  }

  public render(): React.ReactNode {
    const {defaultMenuScroll: omittedDefaultScroll, onChange: omittedOnChange, options, style,
      value: omittedValue, ...otherProps} = this.props
    const selectStyle = {
      color: colors.CHARCOAL_GREY,
      height: 41,
      lineHeight: 1.5,
      width: '100%',
      ...style,
    }
    const menuContainerStyle = {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    }
    // TODO(pascal): Fix type of ReactSelect exported component.
    const ref = (this.subComponent as unknown) as React.RefObject<ReactSelect<SelectOption<T>>>
    return <ReactSelect<SelectOption<T>>
      onChange={this.handleChange}
      value={this.makeValueProp()}
      getOptionLabel={getName}
      isOptionDisabled={getIsDisabled}
      styles={{
        container: (base): React.CSSProperties => ({...base, ...selectStyle}),
        control: (base, {isFocused, isSelected}): ReactSelectCSSProperties => ({
          ...base,
          '&:hover': {
            ...(base as ReactSelectCSSProperties)['&:hover'],
            borderColor: (isFocused || isSelected) ? colors.BOB_BLUE : colors.COOL_GREY,
          },
          'borderColor': (isFocused || isSelected) ? colors.BOB_BLUE : colors.SILVER,
          'borderRadius': 0,
          'boxShadow': 'initial',
          'height': selectStyle.height,
        }),
        placeholder: (base): React.CSSProperties => ({
          ...base,
          color: colors.COOL_GREY,
        }),
      }}
      options={options}
      clearable={false}
      menuContainerStyle={menuContainerStyle}
      onMenuOpen={this.handleMenuOpen}
      ref={ref}
      {...otherProps} />
  }
}



interface BirthYearSelectOption {
  name: string
  value: number
}


interface BirthYearSelectProps {
  onChange: (value: number) => void
  placeholder?: string
  value?: number
}


const yearOfBirthRange = ((): readonly BirthYearSelectOption[] => {
  const currentYear = new Date().getFullYear()
  // We probably don't have any users under the age of 14 or over 100
  const maxBirthYear = currentYear - 14
  const minBirthYear = currentYear - 100
  return _range(minBirthYear, maxBirthYear).map((year): BirthYearSelectOption =>
    ({name: year + '', value: year}),
  )
})()


const BirthYearSelectorBase = (props: BirthYearSelectProps): React.ReactElement => {
  return <Select<number>
    options={yearOfBirthRange}
    defaultMenuScroll={yearOfBirthRange.length - 20}
    {...props} />
}
BirthYearSelectorBase.propTypes = {
  value: PropTypes.number,
}
const BirthYearSelector = React.memo(BirthYearSelectorBase)


export {BirthYearSelector, CheckboxList, FieldSet, Select}
