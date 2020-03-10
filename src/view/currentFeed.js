const renderPosts = (posts) => {
  const container = document.querySelector('[name="Publications"');
  container.innerHTML = '';
  posts.forEach((post) => {
    const { name, description, link } = post;
    const div = document.createElement('div');
    div.classList.add('p-2', 'border', 'rounded');
    const a = document.createElement('a');
    a.setAttribute('href', link);
    const h5 = document.createElement('h5');
    h5.textContent = name;
    a.appendChild(h5);
    const p = document.createElement('p');
    p.classList.add('lead', 'text-justify');
    p.textContent = description;
    div.append(a, p);
    container.appendChild(div);
    return container;
  });
};

const createHeaderPosts = (feed) => {
  const container = document.querySelector('[name="head"');
  container.innerHTML = '';
  const hr = document.createElement('hr');
  const p = document.createElement('p');
  const h5 = document.createElement('h5');
  h5.textContent = feed.name;
  p.textContent = feed.description;
  container.append(hr, h5, p);
  container.classList.add('border', 'border-secondary', 'rounded-lg', 'pl-3', 'pb-3');
};

const activationButton = (feed) => {
  const oldActiveEl = document.querySelector('button.active');
  if (oldActiveEl !== null) {
    oldActiveEl.classList.remove('active');
  }
  const newActiveEl = document.querySelector(`button[id="${feed.id}"]`);
  newActiveEl.classList.add('active');
};

export default (state) => {
  const { status } = state.feed.currentFeed;
  const { posts } = state.data;
  const feed = state.feed.currentFeed;
  const currentPosts = posts.filter(({ id }) => id === feed.id);
  switch (status) {
    case 'init':
      activationButton(feed);
      createHeaderPosts(feed);
      renderPosts(currentPosts);
      break;
    case 'actual':
      break;
    case 'updated':
      renderPosts(currentPosts);
      break;
    default:
      throw new Error(`Unknown status state: '${status}'!`);
  }
};
