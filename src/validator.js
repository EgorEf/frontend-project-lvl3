import { string, mixed } from 'yup';

export default ((state) => {
  const { inputData, addedLinks } = state;
  const schema = string().url();
  const validUrl = schema.isValid(inputData)
    .then((response) => response);
  const schemaArray = mixed().notOneOf(addedLinks);
  const isUniqueUrl = schemaArray.isValid(inputData)
    .then((response) => response);
  const schemaMatch = string().matches(/rss/);
  const toBeRss = schemaMatch.isValid(inputData)
    .then((response) => response);
  return validUrl && isUniqueUrl && toBeRss;
});
