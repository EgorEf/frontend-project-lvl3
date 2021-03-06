import i18next from 'i18next';

export default (state) => {
  const { errorStatus } = state.form;
  const feedbackElement = document.querySelector('div.invalid-feedback');
  feedbackElement.innerHTML = '';
  switch (errorStatus) {
    case 'nothing':
      break;
    case 'invalid':
      feedbackElement.textContent = i18next.t('errors.invalid');
      break;
    case 'not-found':
      feedbackElement.textContent = i18next.t('errors.undefined');
      break;
    case 'network':
      feedbackElement.textContent = i18next.t('errors.network');
      break;
    default:
      throw new Error(`Unknown errorStatus state: '${errorStatus}'!`);
  }
};
