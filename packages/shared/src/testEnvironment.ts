export type TestEnvironment = {
  inCI: boolean;
};

export const defaultGetTestEnvironment = (): TestEnvironment => {
  return {
    inCI: !!process.env.CI,
  };
};
