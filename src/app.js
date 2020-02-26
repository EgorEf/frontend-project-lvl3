import '@babel/polyfill';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import { getPosts, parseXml } from './parser';
import validation from './validator';
import {
  renderError, renderValid, renderCurrentFeed, renderForm,
} from './view';

const proxyServer = {
  path: 'https://cors-anywhere.herokuapp.com',
};

const requestOnUrl = async (url) => {
  const response = await axios.get(url);
  const parser = new DOMParser();
  const xmlData = parser.parseFromString(response.data, 'text/xml');
  return xmlData;
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

  const input = document.querySelector('input.form-control');
  const form = document.querySelector('form');

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { inputData } = state.form;
    state.form.processForm = i18next.t('processForm.sending');
    try {
      const url = `${proxyServer.path}/${inputData}`;
      const xmlData = await requestOnUrl(url);
      const { feed, posts } = parseXml(xmlData, url);
      state.form.processForm = i18next.t('processForm.added');
      state.form.inputData = '';
      if (state.feed.currentFeed) {
        state.feed.currentFeed.status = i18next.t('statusFeed.init');
      }
      state.data.feeds.push(feed);
      posts.forEach((post) => state.data.posts.push(post));
      setTimeout(() => initState(), 0);
    } catch (error) {
      state.form.processForm = i18next.t('processForm.filling');
      state.form.errors = i18next.t('errors.network');
      throw error;
    }
  });

  watch(state.form, 'processForm', () => renderForm(state, input));
  watch(state.form, 'valid', () => renderValid(state, input));
  watch(state.form, 'errors', () => renderError(state));
  watch(state.feed, 'currentFeed', () => renderCurrentFeed(state));

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
      const oldPosts = posts.filter((post) => post.id === feed.id).slice(0, 50);
      const actualPosts = getPosts(newXmlData, feed.id).slice(0, 50);
      const diffPosts = _.differenceWith(actualPosts, oldPosts, _.isEqual);
      if (diffPosts !== []) {
        diffPosts.map((post) => state.data.posts.unshift(post));
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
