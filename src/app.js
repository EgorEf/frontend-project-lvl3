/* eslint arrow-parens: ["error", "always"] */
/* eslint-env es6 */
import '@babel/polyfill';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import parsingRss from './parser';
import validation from './validator';
import {
  renderError, renderValid, renderCurrentFeed, renderForm,
} from './view';

const updateInterval = 5000;
const proxyServer = {
  path: 'https://cors-anywhere.herokuapp.com',
};
const getUrl = (inputData) => `${proxyServer.path}/${inputData}`;

const requestOnUrl = (inputData) => {
  const url = `${proxyServer.path}/${inputData}`;
  const response = axios.get(url);
  return response;
};

const getDiffPosts = (actualPosts, oldPosts) => _.differenceWith(actualPosts, oldPosts, _.isEqual);

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

  const state = {
    form: {
      processForm: 'initial',
      valid: false,
      inputData: null,
      errors: 'nothing',
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
      state.form.processForm = 'initial';
    } else {
      state.form.processForm = 'filling';
      state.form.inputData = target.value;
      validation(state)
        .then((valid) => {
          const typeError = (valid) ? 'nothing' : 'invalid';
          state.form.valid = valid;
          state.form.errors = typeError;
        });
    }
  });

  const resetFormState = () => {
    state.form.processForm = 'initial';
    state.form.valid = false;
    state.form.errors = 'nothing';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { inputData } = state.form;
    state.form.processForm = 'sending';
    const id = _.uniqueId();
    const url = getUrl(inputData);
    axios.get(url)
      .then((response) => {
        const { feed, posts } = parsingRss(response.data, url, id);
        state.form.processForm = 'added';
        state.form.inputData = '';
        if (state.feed.currentFeed) {
          state.feed.currentFeed.status = 'init';
        }
        state.data.feeds.push(feed);
        posts.forEach((post) => state.data.posts.push(post));
      })
      .then(resetFormState())
      .catch((error) => {
        state.form.valid = false;
        state.form.processForm = 'filling';
        state.form.errors = 'not-found';
        throw error;
      });
  });

  watch(state.form, 'processForm', () => renderForm(state, input));
  watch(state.form, 'valid', () => renderValid(state, input));
  watch(state.form, 'errors', () => renderError(state));
  watch(state.feed, 'currentFeed', () => renderCurrentFeed(state));

  const initStatus = () => {
    const { currentFeed } = state.feed;
    if (currentFeed) {
      state.feed.currentFeed.status = 'actual';
    }
  };

  const updatePosts = () => {
    const { currentFeed } = state.feed;
    const { feeds, posts } = state.data;
    if (feeds === []) {
      return;
    }
    feeds.forEach((feed) => {
      const oldPosts = posts.filter((post) => post.id === feed.id);
      requestOnUrl(feed.url)
        .then((response) => parsingRss(response.data, feed.url, feed.id))
        .then((data) => getDiffPosts(data.posts, oldPosts))
        .then((diffPosts) => {
          if (diffPosts !== []) {
            diffPosts.forEach((post) => state.data.posts.unshift(post));
          } if (currentFeed && currentFeed.id === feed.id) {
            currentFeed.status = 'updated';
          }
        })
        .then(initStatus())
        .catch((error) => {
          state.form.valid = false;
          state.form.processForm = 'filling';
          state.form.errors = 'network';
          throw error;
        });
    });
    setTimeout(updatePosts, updateInterval);
  };

  setTimeout(updatePosts, updateInterval);
};
