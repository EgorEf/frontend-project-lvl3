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
      const { form: { inputData }, data: { feeds } } = state;
      validation(feeds, inputData)
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
        const { feed, posts } = parse(response.data);
        state.form.processForm = 'added';
        state.form.inputData = '';
        if (state.feed.currentFeed) {
          state.feed.currentFeed.status = 'init';
        }
        state.data.feeds.push({ ...feed, id, link: inputData });
        posts.forEach((post) => state.data.posts.push({ ...post, id }));
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
      const url = getUrl(feed.link);
      axios.get(url)
        .then((response) => {
          const data = parse(response.data);
          const newPosts = data.posts;
          return newPosts.map((post) => ({ ...post, id: feed.id }));
        })
        .then((newPosts) => getDiffPosts(newPosts, oldPosts))
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
