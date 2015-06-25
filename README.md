# Licode

## Dependencies

Use `scripts/install_deps.sh` to install third party dependencies in ease.

## Build & Install

### liberizo.so

```
scripts/build.sh --liberizo
```

### addon for node-erizo

```
scripts/build.sh --addon
```

### node_modules

```
npm install --production
```

### Configuration

make sure `mongodb` is running.

```
node scripts/gen_config.js # edit local/etc/nuve.json before running below line if needed.
node scripts/initdb.js
```

## Run

`scripts/daemon.sh (start|stop|status) (nuve|controller|agent|sample)`

- start all components:

  `scripts/run-all.sh`

- stop all components:

  `scripts/kill-all.sh`

NOTE: ensure selected message exchanging server, `rabbitmq-server`, `gnatsd`, or `nsqd` is running before launching these licode services.

## Structure

```
.
├── build                   - build dir for third parties and liberizo.so (excluded in git).
├── contrib                 - configuration templates, patches, etc.
├── doc                     - documentation for architecture, usage, design, etc.
├── extras                  - sample.
│   ├── basic_example
│   └── vagrant
├── local                   - HOME for licode distr (excluded in git).
│   ├── bin
│   ├── etc                 - configuration.
│   ├── include
│   ├── lib
│   ├── run                 - HOME for licode runtime.
│   ├── sbin                - binaries from this project.
│   └── xbin                - third party binaries not built from source code.
├── scripts                 - helper scripts.
├── src
│   ├── client
│   │   ├── erizo           - client api for erizo.
│   │   └── nuve            - client api for nuve.
│   ├── common              - common node modules.
│   ├── erizo
│   │   ├── agent           - Erizo agent.
│   │   ├── controller      - Erizo controller.
│   │   └── node-erizo      - ErizoJS.
│   ├── liberizo            - liberizo.so.
│   └── nuve                - nuve.
└── test
```

## Road Map

- [ ] Nuve rewritten, with `nuveadmin` and `nuveclient`.
- [x] Support NATS/NSQ for message exchanging.
- [ ] Better documentation and sample app.
- [ ] Better modularity in Node.js land.
- [ ] Better deployment.
- [ ] Distributed Erizo-Network.
- [ ] Pluggable Erizo controller.
