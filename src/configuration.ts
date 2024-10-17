export const configuration = () => ({
  aws: {
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
  },
});
