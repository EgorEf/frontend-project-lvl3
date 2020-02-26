import _ from 'lodash';

export const getPosts = (data, id) => {
  const items = data.querySelectorAll('item');
  const listPosts = [...items].map((item) => {
    const name = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    const post = {
      name, description, link, id,
    };
    return post;
  });
  return listPosts;
};

const getFeed = (data, url, id) => {
  const name = data.querySelector('channel > title').textContent;
  const description = data.querySelector('channel > description').textContent;
  const feed = {
    name, description, url, id,
  };
  return feed;
};

export const parseXml = (xmlData, url) => {
  const id = _.uniqueId();
  const feed = getFeed(xmlData, url, id);
  const posts = getPosts(xmlData, id);
  return { feed, posts };
};
