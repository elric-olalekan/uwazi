import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveReference} from 'app/Viewer/actions/referencesActions';
import validate from 'validate.js';

export class ViewerSaveReferenceMenu extends Component {
  render() {
    let reference = this.props.reference;
    reference.sourceDocument = this.props.sourceDocument;
    let referenceReady = !validate(reference, {
      sourceDocument: {presence: true},
      targetDocument: {presence: true},
      sourceRange: {presence: true},
      relationType: {presence: true}
    });

    return (
      <button className="btn btn-success" disabled={!referenceReady} onClick={() => {
        if (referenceReady) {
          this.props.saveReference(reference);
        }
      }} >
      <i className="fa fa-save"></i>
      </button>
    );
  }
}

ViewerSaveReferenceMenu.propTypes = {
  saveReference: PropTypes.func,
  sourceDocument: PropTypes.string,
  reference: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveReference}, dispatch);
}

function mapStateToProps(state) {
  return {
    reference: state.documentViewer.uiState.toJS().reference,
    sourceDocument: state.documentViewer.doc.get('_id')
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerSaveReferenceMenu);
