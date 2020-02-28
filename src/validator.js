import { string } from 'yup';

export default ((state) => {
  const { form, data } = state;
  const { inputData } = form;
  const { feeds } = data;
  const schema = string().url();
  const valid = schema.isValid(inputData)
    .then((validUrl) => {
      const listUrls = feeds.map(({ url }) => url);
      const uniqUrl = !(listUrls.includes(inputData));
      const toBeRss = inputData.includes('rss');
      return validUrl && uniqUrl && toBeRss;
    });
  return valid;
});
