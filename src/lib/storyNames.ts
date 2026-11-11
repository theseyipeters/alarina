import { SAMPLE, type DemoValues } from './heroDemo.ts'
import { todayInLagos } from './format.ts'

/** What the scroll story shows: the visitor's own names and date from the hero, else the sample couple. */
export function storyDetails(values: DemoValues) {
  const one = values.one.trim() || SAMPLE.one
  const two = values.two.trim() || SAMPLE.two
  const date = values.date || SAMPLE.date
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y!, m! - 1, d!)
  const [ty, tm, td] = todayInLagos().split('-').map(Number)
  const days = Math.max(0, Math.round((day.getTime() - new Date(ty!, tm! - 1, td!).getTime()) / 86_400_000))
  const plain = (name: string) =>
    name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    one,
    two,
    initials: `${one[0] ?? ''}${two[0] ?? ''}`,
    shortDate: new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }).format(day),
    days,
    slug: `${plain(one) || 'you'}-and-${plain(two) || 'yours'}`,
    typed: Boolean(values.one.trim() || values.two.trim()),
  }
}
