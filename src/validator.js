import { string, mixed, object } from 'yup';

export default (feeds, inputData) => {
  const links = feeds.map(({ link }) => link);
  const schema = object().shape({
    checkUrl: string().url().matches(/rss/),
    checkAddedUrls: mixed().notOneOf(links),
  });
  const validUrl = schema.isValid({ checkUrl: inputData, checkAddedUrls: inputData });
  return validUrl;
};
