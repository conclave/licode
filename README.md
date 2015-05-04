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
node scripts/gen_config.js
node scripts/initdb.js
```

## Run

`scripts/daemon.sh (start|stop|status) (nuve|controller|agent|sample)`

- start all components:

  `scripts/run-all.sh`

- stop all components:

  `scripts/kill-all.sh`

## Structure

```
.
├── build                   - build dir for third parties and liberizo.so (excluded in git).
├── contrib                 - configuration templates, patches, etc.
├── extras                  - sample.
│   ├── basic_example
│   └── vagrant
├── local                   - HOME for licode distr (excluded in git).
│   ├── bin
│   ├── etc                 - configuration.
│   ├── include
│   ├── lib
│   ├── run                 - HOME for licode runtime.
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

## TODOs
