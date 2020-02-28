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

const updateInterval = 5000;
const proxyServer = {
  path: 'https://cors-anywhere.herokuapp.com',
};

const requestOnUrl = (inputData) => {
  const url = `${proxyServer.path}/${inputData}`;
  const response = axios.get(url)
    .then((content) => {
      const parser = new DOMParser();
      const xmlData = parser.parseFromString(content.data, 'text/xml');
      return xmlData;
    });
  return response;
};

export default () => {
  i18next.init({
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

  input.addEventListener('input', ({ target }) => {
    if (target.value === '') {
      state.form.processForm = i18next.t('processForm.initial');
    } else {
      state.form.processForm = i18next.t('processForm.filling');
      state.form.inputData = target.value;
      validation(state)
        .then((valid) => {
          const error = (valid) ? null : i18next.t('errors.valid');
          state.form.valid = valid;
          state.form.errors = error;
        });
    }
  });

  const initState = () => {
    state.form.processForm = i18next.t('processForm.initial');
    state.form.valid = false;
    state.form.errors = null;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { inputData } = state.form;
    state.form.processForm = i18next.t('processForm.sending');
    requestOnUrl(inputData)
      .then((xmlData) => {
        const { feed, posts } = parseXml(xmlData, inputData);
        state.form.processForm = i18next.t('processForm.added');
        state.form.inputData = '';
        if (state.feed.currentFeed) {
          state.feed.currentFeed.status = i18next.t('statusFeed.init');
        }
        state.data.feeds.push(feed);
        posts.forEach((post) => state.data.posts.push(post));
        setTimeout(() => initState(), 0);
      })
      .catch((error) => {
        state.form.valid = false;
        state.form.processForm = i18next.t('processForm.filling');
        state.form.errors = i18next.t('errors.undefined');
        throw error;
      });
  });

  watch(state.form, 'processForm', () => renderForm(state, input));
  watch(state.form, 'valid', () => renderValid(state, input));
  watch(state.form, 'errors', () => renderError(state));
  watch(state.feed, 'currentFeed', () => renderCurrentFeed(state));

  const initStatus = () => {
    state.feed.currentFeed.status = i18next.t('statusFeed.actual');
  };

  setTimeout(function updatePosts() {
    const { currentFeed } = state.feed;
    const { feeds, posts } = state.data;
    if (feeds === []) {
      return;
    }
    feeds.forEach((feed) => {
      requestOnUrl(feed.url)
        .then((xmlData) => {
          const oldPosts = posts.filter((post) => post.id === feed.id).slice(0, 50);
          const actualPosts = getPosts(xmlData, feed.id).slice(0, 50);
          const diffPosts = _.differenceWith(actualPosts, oldPosts, _.isEqual).reverse();
          if (diffPosts !== []) {
            diffPosts.map((post) => state.data.posts.unshift(post));
          } if (currentFeed && currentFeed.id === feed.id) {
            currentFeed.status = i18next.t('statusFeed.updated');
            setTimeout(() => initStatus(), 0);
          } if (currentFeed && diffPosts === []) {
            currentFeed.status = i18next.t('statusFeed.actual');
          }
        });
    });
    setTimeout(updatePosts, updateInterval);
  }, updateInterval);
};
