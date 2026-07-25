export interface DefaultLogSource {
  label: string
  url: string
}

export const DEFAULT_LOG_SOURCES: DefaultLogSource[] = [
  {
    label: 'api_signal1.log',
    url: `${import.meta.env.BASE_URL}samples/api_signal1.log`,
  },
  {
    label: 'api_signal2.log',
    url: `${import.meta.env.BASE_URL}samples/api_signal2.log`,
  },
  {
    label: 'api_signal3.log',
    url: `${import.meta.env.BASE_URL}samples/api_signal3.log`,
  },
]
