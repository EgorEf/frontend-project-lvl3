export default (state) => {
  const feedbackElement = document.querySelector('div.invalid-feedback');
  feedbackElement.innerHTML = '';
  feedbackElement.textContent = state.form.errors;
};
