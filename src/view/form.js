/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state", "input"] }] */
const hundlerClick = (state) => ({ target }) => {
  const currentId = target.id;
  const feed = state.data.feeds.find(({ id }) => id === currentId);
  const { name, description } = feed;
  state.feed.currentFeed = {
    name, description, id: currentId, status: 'init',
  };
};

const renderFeeds = (state) => {
  const { feeds } = state.data;
  const listFeeds = document.querySelector('[name="Feeds"]');
  listFeeds.innerHTML = '';
  feeds.map((feed) => {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('id', feed.id);
    button.classList.add('btn', 'btn-light', 'border');
    button.textContent = `${feed.name}`;
    button.addEventListener('click', hundlerClick(state));
    listFeeds.appendChild(button);
    return listFeeds;
  });
};

export default (state, input) => {
  const submitButton = document.querySelector('button[type="submit"]');
  const { processForm } = state.form;
  switch (processForm) {
    case 'initial':
      input.classList.remove('is-invalid');
      submitButton.disabled = true;
      break;
    case 'filling':
      submitButton.disabled = true;
      input.classList.add('is-invalid');
      break;
    case 'sending':
      submitButton.disabled = true;
      break;
    case 'added':
      renderFeeds(state);
      input.value = '';
      break;
    default:
      throw new Error(`Unknown process state: '${processForm}'!`);
  }
};
