import {expect} from 'chai'
import {clearEmoji, clearMarkup} from 'store/clean_text'


describe('clearMarkup', (): void => {
  it('removes all the bold markups', (): void => {
    expect(clearMarkup('This is a **bolded text**.')).to.equal('This is a bolded text.')
  })

  it('removes all the link markups, keeping the inlined text', (): void => {
    expect(clearMarkup('This is a [link to bob](https://www.example.com), and another [link].')).
      to.equal('This is a link to bob, and another link.')
  })
})


describe('clearEmoji', (): void => {
  it('removes all the emojis', (): void => {
    expect(clearEmoji('Are you smirking? 😏 or perplex? 🤨')).
      to.equal('Are you smirking?  or perplex? ')
  })
})
