import i18next from 'i18next';

export default (state, input) => {
  const submitButton = document.querySelector('button[type="submit"]');
  if (state.form.valid === true) {
    input.classList.remove('is-invalid');
    submitButton.disabled = !state.form.valid;
  } else if (state.form.valid === false && state.form.processForm === i18next.t('processForm.initial')) {
    input.classList.remove('is-invalid');
    submitButton.disabled = !state.form.valid;
  } else {
    input.classList.add('is-invalid');
  }
};
