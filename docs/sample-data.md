# Sample data

The dashboard includes three authorized sample logs copied from
[`uoio8090/api_log`](https://github.com/uoio8090/api_log). They are versioned
locally so the public demo remains reproducible if the upstream files change.

| Local file | Upstream URL | SHA-256 |
|---|---|---|
| `public/samples/api_signal1.log` | [source](https://raw.githubusercontent.com/uoio8090/api_log/main/api_signal1.log) | `b16a2bf4356d87c0aa22b5a61ae9ff5ebda20cad95bc0e383da7aa4e25e4491d` |
| `public/samples/api_signal2.log` | [source](https://raw.githubusercontent.com/uoio8090/api_log/main/api_signal2.log) | `29f21d69f1f8199e887174e7298f3593190a11e59f88db4a993fd986eaf4d09b` |
| `public/samples/api_signal3.log` | [source](https://raw.githubusercontent.com/uoio8090/api_log/main/api_signal3.log) | `2d7270f75c76c67ee4e0c393dbb1aaa82306396fc319c7b789e504caa4d30d3a` |

`api_signal2.log` contains 40 `ERROR` and 30 `TIMEOUT` events. The parser
intentionally surfaces those 70 unsupported-status lines in the skipped-line
panel while preserving 70 corresponding requests as unpaired.
