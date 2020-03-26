import { string, mixed, object } from 'yup';

export default (form) => {
  const { inputData, addedLinks } = form;
  const schema = object().shape({
    checkUrl: string().url().matches(/rss/),
    checkAddedUrls: mixed().notOneOf(addedLinks),
  });
  const validUrl = schema.isValid({ checkUrl: inputData, checkAddedUrls: inputData });
  return validUrl;
};
