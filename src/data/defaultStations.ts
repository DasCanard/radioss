import { RadioStation } from '../types';

export const defaultStations: RadioStation[] = [
  {
    id: '1',
    name: 'SWR3',
    url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3',
    country: 'Germany',
    language: 'German',
    tags: ['Pop', 'Rock', 'News'],
    favicon: 'https://www.swr3.de/favicon.ico'
  },
  {
    id: '2',
    name: 'Radio Hamburg',
    url: 'https://frontend.streamonkey.net/rhh-1036',
    country: 'Germany',
    language: 'German',
    tags: ['Pop', 'Local'],
    favicon: 'https://www.radiohamburg.de/favicon.ico'
  },
  {
    id: '3',
    name: '1LIVE',
    url: 'https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3',
    country: 'Germany',
    language: 'German',
    tags: ['Pop', 'Hip-Hop', 'Electronic'],
    favicon: 'https://www1.wdr.de/favicon.ico'
  },
  {
    id: '4',
    name: 'Deutschlandfunk',
    url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3',
    country: 'Germany',
    language: 'German',
    tags: ['News', 'Culture', 'Information'],
    favicon: 'https://www.deutschlandfunk.de/favicon.ico'
  },
  {
    id: '5',
    name: 'Antenne Bayern',
    url: 'https://stream.antenne.de/antenne/stream/mp3',
    country: 'Germany',
    language: 'German',
    tags: ['Pop', 'Rock', 'Hits'],
    favicon: 'https://www.antenne.de/logos/station-antenne-bayern/favicon.ico'
  },
  {
    id: '6',
    name: 'Radio Bob!',
    url: 'https://streams.radiobob.de/bob-live/mp3-192/mediaplayer',
    country: 'Germany',
    language: 'German',
    tags: ['Rock', 'Metal', 'Classic Rock'],
    favicon: 'https://upload.radiobob.de/production/static/1747689988107/icons/icon_64.8WpccMNcjjc.png'
  },
  {
    id: '7',
    name: 'Sunshine Live',
    url: 'http://stream.sunshine-live.de/live/mp3-128',
    country: 'Germany',
    language: 'German',
    tags: ['Electronic', 'Dance', 'House'],
    favicon: 'https://upload.sunshine-live.de/production/static/1747690248747/icons/icon_64.fmRwc30M41g.png'
  },
  {
    id: '8',
    name: 'Fritz',
    url: 'https://dispatcher.rndfnk.com/rbb/fritz/live/mp3/mid',
    country: 'Germany',
    language: 'German',
    tags: ['Alternative', 'Pop', 'Rock'],
    favicon: 'https://www.fritz.de/favicon.ico'
  }
];