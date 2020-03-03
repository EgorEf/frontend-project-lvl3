export default (state, input) => {
  const { valid } = state.form;
  const submitButton = document.querySelector('button[type="submit"]');
  if (state.form.valid === true) {
    input.classList.remove('is-invalid');
    submitButton.disabled = !valid;
  } else if (valid === false && state.form.processForm === 'initial') {
    input.classList.remove('is-invalid');
    submitButton.disabled = !valid;
  } else {
    input.classList.add('is-invalid');
    submitButton.disabled = !valid;
  }
};
