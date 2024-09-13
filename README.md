[![npm](https://img.shields.io/npm/v/@vslint/jest)](https://www.npmjs.com/package/@vslint/jest)
# vslint (visual eslint)

VSLint uses multimodal AI models to analyze html snapshots generated by your test suite and give feedback on whether or not they meet design best practices.

```typescript
// extend jest's expect
expect.extend(extendExpectDesignReviewer({
  snapshotsDir: '__tests__/__snapshots__',
  cssPath: './styles/globals.css'
}));

test('should render a button', () => {
  const { container } = render(<Button>Hello World</Button>);
  // use the new matcher to check if the snapshot passes design review
  expect(container).toPassDesignReview();
});
```

## Usage
Right now VSLint only supports the `jest` test runner. You can either deploy your own review server or use a shared default server (warning this is rate limited so this should not be used in production as you may run into issues).

### Jest
```bash
npm install @vslint/jest --save-dev
```
In order to render your content correctly, VSLint requires a css file to be passed in. This file will be used to generate a hash of the css file and the snapshot. This hash is used to cache results for tests based on the snapshot and the css file.
```typescript
// extend jest's expect
expect.extend(extendExpectDesignReviewer({
  snapshotsDir: '__tests__/__snapshots__',
  cssPath: './styles/globals.css'
}));
```
| Parameter                | type     | default                  | Description
| ------------------------ | -------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `snapshotsDir`             | `string`   |                          | The directory where the snapshots are stored.
| `cssPath`                  | `string`   |                          | The path to the css file that is used to generate the hash of the css file and the snapshot.
| `forceReview`             | `boolean`  | `false`                    | If true, the snapshot will be reviewed even if it has already been reviewed and the content of your snapshot has not changed.
| `reviewEndpoint`          | `string`   | `sample` | The endpoint to use for the review server.

