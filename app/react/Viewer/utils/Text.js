import TextRange from 'batarange';
import wrapper from 'app/utils/wrapper';

export default function (container) {
  return {
    container,
    renderedReferences: {},
    highlightedReference: null,

    selected() {
      return window.getSelection().toString() !== '';
    },

    getSelection() {
      let selection = window.getSelection();
      let range = selection.getRangeAt(0);
      let serializedRange = TextRange.serialize(range, container);
      serializedRange.text = selection.toString();
      return serializedRange;
    },

    searchRenderedReference(referenceId) {
      let reference = null;
      Object.keys(this.renderedReferences).forEach((referencesKey) => {
        if (this.renderedReferences[referencesKey][referenceId]) {
          reference = this.renderedReferences[referencesKey][referenceId];
        }
      });
      return reference;
    },

    highlight(referenceId) {
      let reference = this.searchRenderedReference(referenceId);
      let highlightedReference = this.searchRenderedReference(this.highlightedReference);

      if (highlightedReference) {
        highlightedReference.nodes.forEach((node) => {
          node.classList.remove('highlighted');
        });
      }

      if (reference) {
        reference.nodes.forEach((node) => {
          node.classList.add('highlighted');
        });
      }

      this.highlightedReference = referenceId;
    },

    activate(referenceId) {
      let reference = this.searchRenderedReference(referenceId);
      let activeReference = this.searchRenderedReference(this.activeReference);

      if (activeReference) {
        activeReference.nodes.forEach((node) => {
          node.classList.remove('is-active');
        });
      }

      if (reference) {
        reference.nodes.forEach((node) => {
          node.classList.add('is-active');
        });
      }

      this.activeReference = referenceId;
    },

    simulateSelection(range, force) {
      this.removeSimulatedSelection();
      if (!range || this.selected() && !force) {
        return;
      }

      let restoredRange = TextRange.restore(range, container);
      let elementWrapper = document.createElement('span');
      elementWrapper.classList.add('fake-selection');
      this.fakeSelection = wrapper.wrap(elementWrapper, restoredRange);
    },

    removeSimulatedSelection() {
      if (this.fakeSelection) {
        this.removeSelection();
        this.fakeSelection.unwrap();
        this.fakeSelection = null;
      }
    },

    isSelectionOnContainer() {
      let node = window.getSelection().baseNode;
      while (node && node !== this.container && node.nodeName !== 'BODY') {
        node = node.parentNode;
      }

      return node === this.container;
    },

    removeSelection() {
      if (!this.selected() || !this.isSelectionOnContainer()) {
        return;
      }
      if (window.getSelection) {
        if (window.getSelection().empty) {
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
          window.getSelection().removeAllRanges();
        }
      }
    },

    renderReferences(references, identifier = 'reference', elementWrapperType = 'a') {
      let rangeProperty = 'range';
      let ids = [];
      if (!this.renderedReferences[identifier]) {
        this.renderedReferences[identifier] = {};
      }
      references.forEach((reference) => {
        if (!container.innerHTML) {
          throw new Error('Container does not have any html yet, make sure you are loading the html before the references');
        }
        ids.push(reference._id);
        if (this.renderedReferences[identifier][reference._id] || !reference[rangeProperty]) {
          return;
        }
        let restoredRange = TextRange.restore(reference[rangeProperty], container);
        let elementWrapper = document.createElement(elementWrapperType);
        elementWrapper.classList.add(identifier);
        elementWrapper.setAttribute('data-id', reference._id);
        this.renderedReferences[identifier][reference._id] = wrapper.wrap(elementWrapper, restoredRange);
      });

      Object.keys(this.renderedReferences[identifier]).forEach((id) => {
        if (ids.indexOf(id) === -1) {
          this.renderedReferences[identifier][id].unwrap();
          delete this.renderedReferences[identifier][id];
        }
      });
    }
  };
}
