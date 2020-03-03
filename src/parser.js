
export const getPosts = (data, id) => {
  const items = data.querySelectorAll('item');
  const listPosts = [...items].map((item) => {
    const titleElement = item.querySelector('title');
    const descriptionElement = item.querySelector('description');
    const linkElement = item.querySelector('link');
    const name = titleElement.textContent;
    const description = descriptionElement.textContent;
    const link = linkElement.textContent;
    const post = {
      name, description, link, id,
    };
    return post;
  });
  return listPosts;
};

const getFeed = (data, url, id) => {
  const titleElement = data.querySelector('channel > title');
  const name = titleElement.textContent;
  const descriptionElement = data.querySelector('channel > description');
  const description = descriptionElement.textContent;
  const feed = {
    name, description, url, id,
  };
  return feed;
};

export default (data, url, id) => {
  const parser = new DOMParser();
  const xmlData = parser.parseFromString(data, 'text/xml');
  const feed = getFeed(xmlData, url, id);
  const posts = getPosts(xmlData, id);
  return { feed, posts };
};
