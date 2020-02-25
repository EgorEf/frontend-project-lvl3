import '@babel/polyfill';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import { string } from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';

const proxyServer = {
  path: 'https://cors-anywhere.herokuapp.com',
};

const getPosts = (data, id) => {
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

const requestOnUrl = async (url) => {
  const response = await axios.get(`${proxyServer.path}/${url}`);
  const parser = new DOMParser();
  const xmlData = parser.parseFromString(response.data, 'text/xml');
  return xmlData;
};

const validation = async (state) => {
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
export default async () => {
  await i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

  const state = {
    form: {
      processForm: i18next.t('processForm.initial'),
      valid: false,
      inputData: null,
      errors: null,
    },
    data: {
      feeds: [],
      posts: [],
    },
    feed: {
      currentFeed: null,
    },
  };

  const hundlerClick = ({ target }) => {
    const currentId = target.id;
    const { name, description } = state.data.feeds.find(({ id }) => id === currentId);
    state.feed.currentFeed = {
      name, description, id: currentId, status: i18next.t('statusFeed.init'),
    };
  };

  const renderFeeds = (feeds) => {
    const listFeeds = document.querySelector('[name="Feeds"]');
    listFeeds.innerHTML = '';
    feeds.map((feed) => {
      const btn = document.createElement('button');
      btn.setAttribute('type', 'button');
      btn.setAttribute('id', feed.id);
      btn.classList.add('btn', 'btn-light', 'border');
      if (feed.status === 'active') {
        btn.classList.add('active');
      }
      btn.textContent = `${feed.name}`;
      btn.addEventListener('click', hundlerClick);
      listFeeds.appendChild(btn);
      return listFeeds;
    });
  };

  const submitButton = document.querySelector('button[type="submit"]');
  const input = document.querySelector('input.form-control');

  input.addEventListener('input', async ({ target }) => {
    if (target.value === '') {
      state.form.processForm = i18next.t('processForm.initial');
    } else {
      state.form.processForm = i18next.t('processForm.filling');
      state.form.inputData = target.value;
      const valid = await validation(state);
      const error = (valid) ? null : i18next.t('errors.valid');
      state.form.valid = valid;
      state.form.errors = error;
    }
  });

  const initState = () => {
    state.form.processForm = i18next.t('processForm.initial');
    state.form.valid = false;
    state.form.errors = null;
  };

  const form = document.querySelector('form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { inputData } = state.form;
    state.form.processForm = i18next.t('processForm.sending');
    try {
      const xmlData = await requestOnUrl(inputData);
      const id = _.uniqueId();
      const feed = getFeed(xmlData, inputData, id);
      const posts = getPosts(xmlData, id);
      state.form.processForm = i18next.t('processForm.added');
      state.form.inputData = '';
      state.data.feeds.push(feed);
      posts.forEach((post) => state.data.posts.push(post));
      setTimeout(() => initState(), 0);
    } catch (error) {
      state.form.processForm = i18next.t('processForm.filling');
      state.form.errors = i18next.t('errors.network');
      throw error;
    }
  });

  watch(state.form, 'processForm', () => {
    const { processForm } = state.form;
    switch (processForm) {
      case i18next.t('processForm.initial'):
        input.classList.remove('is-invalid');
        submitButton.disabled = true;
        break;
      case i18next.t('processForm.filling'):
        submitButton.disabled = true;
        input.classList.add('is-invalid');
        break;
      case i18next.t('processForm.sending'):
        submitButton.disabled = true;
        break;
      case i18next.t('processForm.added'):
        renderFeeds(state.data.feeds);
        input.value = '';
        break;
      default:
        console.log('boom');
    }
  });

  watch(state.form, 'valid', () => {
    if (state.form.valid === true) {
      input.classList.remove('is-invalid');
      submitButton.disabled = !state.form.valid;
    } else if (state.form.valid === false && state.form.processForm === i18next.t('processForm.initial')) {
      input.classList.remove('is-invalid');
      submitButton.disabled = !state.form.valid;
    } else {
      input.classList.add('is-invalid');
    }
  });

  watch(state.form, 'errors', () => {
    const feedbackElement = document.querySelector('div.invalid-feedback');
    feedbackElement.innerHTML = '';
    feedbackElement.textContent = state.form.errors;
  });

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

  const activationButton = (feed) => {
    const oldActiveEl = document.querySelector('button.active');
    if (oldActiveEl !== null) {
      oldActiveEl.classList.remove('active');
    }
    const newActiveEl = document.querySelector(`button[id="${feed.id}"]`);
    newActiveEl.classList.add('active');
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
  };

  watch(state.feed, 'currentFeed', () => {
    const { status } = state.feed.currentFeed;
    const feed = state.feed.currentFeed;
    const currentPosts = state.data.posts.filter(({ id }) => id === feed.id);
    switch (status) {
      case i18next.t('statusFeed.init'):
        activationButton(feed);
        createHeaderPosts(feed);
        renderPosts(currentPosts);
        break;
      case i18next.t('statusFeed.actual'):
        break;
      case i18next.t('statusFeed.updated'):
        renderPosts(currentPosts);
        break;
      default:
        console.log('err');
    }
  });

  const initStatus = () => {
    state.feed.currentFeed.status = i18next.t('statusFeed.actual');
  };

  setTimeout(async function updatePost() {
    const { currentFeed } = state.feed;
    const { feeds, posts } = state.data;
    if (feeds === []) {
      return;
    }
    feeds.forEach(async (feed) => {
      const newXmlData = await requestOnUrl(feed.url);
      const oldPosts = posts.filter((post) => post.id === feed.id);
      const actualPosts = getPosts(newXmlData, feed.id);
      const diffPosts = _.differenceWith(actualPosts, oldPosts, _.isEqual).reverse();
      if (diffPosts !== []) {
        state.data.posts = [...diffPosts, ...posts];
      } if (currentFeed && currentFeed.id === feed.id) {
        currentFeed.status = i18next.t('statusFeed.updated');
        setTimeout(() => initStatus(), 0);
      } if (currentFeed && diffPosts === []) {
        currentFeed.status = i18next.t('statusFeed.actual');
      }
    });
    setTimeout(updatePost, 10000);
  }, 10000);
};
