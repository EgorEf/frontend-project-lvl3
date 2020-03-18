import { watch } from 'melanke-watchjs';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import parse from './parser';
import validation from './validator';
import {
  renderError, renderValid, renderCurrentFeed, renderForm,
} from './view';

const updateInterval = 5000;
const proxyServer = {
  path: 'https://cors-anywhere.herokuapp.com',
};
const getUrl = (inputData) => `${proxyServer.path}/${inputData}`;

const getDiffPosts = (actualPosts, oldPosts) => _.differenceWith(actualPosts, oldPosts, _.isEqual);

const getPreparedData = (data, id, url) => {
  const { head, items } = data;
  const propertyForFeed = { id, url };
  const propertyForPosts = { id };
  const feed = { ...head, ...propertyForFeed };
  const posts = items.map((item) => ({ ...item, ...propertyForPosts }));
  return { feed, posts };
};

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
      addedLinks: [],
      errorStatus: 'nothing',
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
      validation(state.form)
        .then((valid) => {
          const typeError = (valid) ? 'nothing' : 'invalid';
          state.form.valid = valid;
          state.form.errorStatus = typeError;
        });
    }
  });

  const resetFormState = () => {
    state.form.processForm = 'initial';
    state.form.valid = false;
    state.form.errorStatus = 'nothing';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { inputData } = state.form;
    state.form.processForm = 'sending';
    const url = getUrl(inputData);
    const id = _.uniqueId();
    axios.get(url)
      .then((response) => {
        const data = parse(response.data);
        const { feed, posts } = getPreparedData(data, id, url);
        state.form.addedLinks.push(inputData);
        state.form.processForm = 'added';
        state.form.inputData = '';
        if (state.feed.currentFeed) {
          state.feed.currentFeed.status = 'init';
        }
        state.data.feeds.push(feed);
        posts.forEach((post) => state.data.posts.push(post));
      })
      .catch((error) => {
        state.form.valid = false;
        state.form.processForm = 'filling';
        state.form.errorStatus = 'not-found';
        throw error;
      });
    resetFormState();
  });

  watch(state.form, 'processForm', () => renderForm(state, input));
  watch(state.form, 'valid', () => renderValid(state, input));
  watch(state.form, 'errorStatus', () => renderError(state));
  watch(state.feed, 'currentFeed', () => renderCurrentFeed(state));

  const initUpdateStatus = () => {
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
      axios.get(feed.url)
        .then((response) => {
          const data = parse(response.data);
          return getPreparedData(data, feed.id);
        })
        .then((preparedData) => getDiffPosts(preparedData.posts, oldPosts))
        .then((diffPosts) => {
          if (diffPosts !== []) {
            diffPosts.forEach((post) => state.data.posts.unshift(post));
          } if (currentFeed && currentFeed.id === feed.id) {
            currentFeed.status = 'updated';
          }
        })
        .catch((error) => {
          state.form.valid = false;
          state.form.processForm = 'filling';
          state.form.errorStatus = 'network';
          throw error;
        });
      initUpdateStatus();
    });
    setTimeout(updatePosts, updateInterval);
  };

  setTimeout(updatePosts, updateInterval);
};
