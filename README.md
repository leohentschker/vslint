[![npm](https://img.shields.io/npm/v/@vslint/jest)](https://www.npmjs.com/package/@vslint/jest)
# vslint (visual eslint) - enforce design patterns in CI
VSLint uses multimodal AI models to analyze html snapshots generated by your test suite and give feedback on whether or not they meet design best practices.

```typescript
// extend jest's expect
expect.extend(extendExpectDesignReviewer({
  snapshotsDir: '__tests__/__snapshots__',
  cssPath: './styles/globals.css',
  model: {
    modelName: 'gemini-1.5-flash',
    key: 'GEMINI_API_KEY'
  }
}));

test('should render a button', () => {
  const { container } = render(<Button>Hello World</Button>);
  // use the new matcher to check if the snapshot passes design review
  await expect(container).toPassDesignReview();
});
```

## Usage
Right now VSLint only supports the `jest` test runner. You can either deploy your own review server or use a shared default server.

### Jest
```bash
npm install @vslint/jest --save-dev
```
The first step is to extend jest's expect to include a new matcher that the design review.
```typescript
import { extendExpectDesignReviewer } from '@vslint/jest';

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
| `forceReviewTest`             | `boolean`  | `false`                    | If true, the snapshot will be reviewed even again if it has already been reviewed and the content of your snapshot has not changed.
| `reviewEndpoint`          | `string`   | `https://vslint-644118703752.us-central1.run.app/api/v1/design-review` | The endpoint to use for the review server.
| `log`                     | `string` or `winston.Logger`  | `info`                    | Allows you to set a log level or pass in a custom Winston logger.
| `model`                    | `{ modelName: string; key: string }`  |         | API credentials for the design review model. Supported models are `gpt-4o`, `gpt-4o-mini` and `gemini-1.5-flash`

Now that the matcher is setup, you can use it in your tests to check if the snapshot passes design review. The `toPassDesignReview` method expects to be called on an `HTMLElement`.
```typescript
import { render } from '@testing-library/react';

test('render text that is too long and hard to read', () => {
  const { container } = render(<div>Incredibly long content potentially too long. Human readability is best at a maximum of 75 characters</div>);
  // it's important to always await the matcher as the design review call is asynchronous
  await expect(container).toPassDesignReview();
});
```
