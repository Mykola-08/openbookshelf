export const deployment = {
  isSelfHosted:
    process.env.NEXT_PUBLIC_SELF_HOSTED === "true" ||
    process.env.SELF_HOSTED === "true",
};
