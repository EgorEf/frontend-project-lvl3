import { string } from 'yup';

export default async (state) => {
  const { form, data } = state;
  const { inputData } = form;
  const { feeds } = data;
  const schema = string().url();
  const validUrl = await schema.isValid(inputData);
  const listUrls = feeds.map(({ url }) => url);
  const uniqUrl = !(listUrls.includes(inputData));
  const toBeRss = inputData.includes('rss');
  return validUrl && uniqUrl && toBeRss;
};
