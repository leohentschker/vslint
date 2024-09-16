[![npm](https://img.shields.io/npm/v/@vslint/jest)](https://www.npmjs.com/package/@vslint/jest)
# vslint (visual eslint) - enforce design patterns in CI
VSLint uses multimodal AI models to analyze html snapshots generated by your test suite and give feedback on whether or not they meet design best practices.


```typescript
import { render } from '@testing-library/react';
import { extendExpectDesignReviewer } from '@vslint/jest';
import Button from '../src/Button'; // Adjust the import path as needed

// extend jest's expect
expect.extend(extendExpectDesignReviewer({
  snapshotsDir: '__tests__/__snapshots__',
  cssPath: './styles/globals.css',
  model: {
    modelName: 'gpt-4o-mini',
    key: process.env.OPENAI_API_KEY
  }
}));

test('text content that is too wide on desktop screens and is not legible', async () => {
  const { container } = render(<div>Incredibly long content potentially too long. Human readability is best at a maximum of 75 characters</div>);
  // note that the matcher must always be async
  await expect(container).toPassDesignReview();  await expect(container).toPassDesignReview();
});
```
![Description](./assets/image.png)

## Usage
Right now VSLint only supports the `jest` test runner.

### Jest
```bash
npm install @vslint/jest --save-dev
```

#### Creating the design review matcher
The first step is to extend jest's expect to include a new matcher that performs the design review.
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

#### Using the design review matcher
Now that the matcher is setup, you can use it in your tests to check if the snapshot passes design review. The `toPassDesignReview` method expects to be called on an `HTMLElement`.
```typescript
import { render } from '@testing-library/react';

test('render text that is too long and hard to read', () => {
  const { container } = render(<div>Incredibly long content potentially too long. Human readability is best at a maximum of 75 characters</div>);
  // it's important to always await the matcher as the design review call is asynchronous
  await expect(container).toPassDesignReview();
});
```

| Parameter                | type     | default                  | Description
| ------------------------ | -------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `atSize`                  | `string` | `{ width: number; height: number;}`   | `{ width: 1920, height: 1080 }`                    | The viewport size to render the content at. Can be `full-screen`, `mobile`, `tablet`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`
| `log`                     | `string` or `winston.Logger`  | `info`                    | Allows you to set a log level or pass in a custom Winston logger.
| `forceReviewTest`             | `boolean`  | `false`                    | If true, the snapshot for this test will be reviewed again even if it has already been reviewed and the content of your snapshot has not changed.

## Deploying your own review server
Deploy the dockerfile at `packages/server/Dockerfile` to a cloud provider of your choice to run your own design review server. Doing so will prevent you from hitting the rate limit of the default server and seeing slower results.

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run?git_repo=https://github.com/leohentschker/vslint&revision=main&dir=packages/server)


## Security and Privacy concerns
VSLint supports using OpenAI and Gemini models to perform the design review. This means that your snapshots are sent to the OpenAI or Gemini API and your API key is sent to the server. If you are concerned about privacy, you should deploy your own review server and use that instead.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
