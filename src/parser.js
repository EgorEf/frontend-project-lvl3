const getPosts = (data) => {
  const items = data.querySelectorAll('item');
  const listPosts = [...items].map((item) => {
    const titleElement = item.querySelector('title');
    const descriptionElement = item.querySelector('description');
    const linkElement = item.querySelector('link');
    const name = titleElement.textContent;
    const description = descriptionElement.textContent;
    const link = linkElement.textContent;
    const post = { name, description, link };
    return post;
  });
  return listPosts;
};

const getFeed = (data) => {
  const titleElement = data.querySelector('channel > title');
  const name = titleElement.textContent;
  const descriptionElement = data.querySelector('channel > description');
  const description = descriptionElement.textContent;
  const feed = { name, description };
  return feed;
};

export default (data) => {
  const parser = new DOMParser();
  const docData = parser.parseFromString(data, 'text/xml');
  const feed = getFeed(docData);
  const posts = getPosts(docData);
  return { feed, posts };
};
