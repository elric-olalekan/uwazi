import React, { Component, PropTypes } from 'react'

class InputField extends Component {

  render = () => {
    return (
      <div className="form-group col-xs-9">
        <label htmlFor="label" className="col-xs-2 control-label">{this.props.label}</label>
        <div className="col-xs-10">
          <input type="text" ref={(ref) => this.input = ref} defaultValue={this.props.defaultValue} className="form-control" id="label" placeholder="placeholder"/>
        </div>
      </div>
    )
  }

}
export default InputField;