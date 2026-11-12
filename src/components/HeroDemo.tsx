import { SAMPLE, type useDemo } from '../lib/heroDemo.ts'
import { todayInLagos } from '../lib/format.ts'
import DatePicker from './DatePicker.tsx'
import Field from './Field.tsx'
import NameInput from './NameInput.tsx'
import './HeroDemo.css'

type Props = { demo: ReturnType<typeof useDemo> }

/** The "try it with your names" fields beside the live invitation in the hero. */
export default function HeroDemo({ demo: { values, set, shuffle } }: Props) {
  return (
    <form className="demo-form" onSubmit={(e) => e.preventDefault()} aria-label="Try it with your names">
      <p className="demo-form-title">Try it with your names</p>
      <div className="demo-form-row">
        <Field label="Partner one">
          {(p) => (
            <NameInput {...p} label="Partner one" value={values.one} onChange={(one) => set({ one })} maxLength={30} placeholder={SAMPLE.one} />
          )}
        </Field>
        <Field label="Partner two">
          {(p) => (
            <NameInput {...p} label="Partner two" value={values.two} onChange={(two) => set({ two })} maxLength={30} placeholder={SAMPLE.two} />
          )}
        </Field>
      </div>
      <div className="demo-form-row">
        <Field label="Wedding date">
          {(p) => (
            <DatePicker {...p} value={values.date} onChange={(date) => set({ date })} min={todayInLagos()} placeholder="Choose a date" />
          )}
        </Field>
        <div className="demo-form-shuffle">
          <button type="button" className="btn btn--secondary" onClick={shuffle}>Try another design</button>
        </div>
      </div>
    </form>
  )
}
