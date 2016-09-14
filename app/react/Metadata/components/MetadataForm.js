import React, {Component, PropTypes} from 'react';
import {Form} from 'react-redux-form';

import validator from '../helpers/validator';

import {FormGroup, FormField, Select, MultiSelect, MarkDown, DatePicker, ViolatedArticles, ViolatedArticlesField} from 'app/Forms';

export class MetadataForm extends Component {

  onSubmit(entity) {
    this.props.onSubmit(entity);
  }

  render() {
    let {metadata, state} = this.props;
    let templates = this.props.templates.toJS();

    templates = templates.filter((template) => {
      if (metadata.type === 'entity') {
        return template.isEntity;
      }
      return !template.isEntity;
    });

    let thesauris = this.props.thesauris.toJS();
    let template = templates.find((t) => t._id === metadata.template);
    const {model} = this.props;
    if (!template) {
      return <div />;
    }

    const templateOptions = templates.map((t) => {
      return {label: t.name, value: t._id};
    });

    return (
      <Form id='metadataForm' model={model} onSubmit={this.props.onSubmit} validators={validator.generate(template)}>

        <FormGroup {...state.fields.title}>
          <label>Title <span className="required">*</span></label>
          <FormField model={`${model}.title`}>
            <textarea className="form-control"/>
          </FormField>
        </FormGroup>

        <FormGroup>
          <label>Type <span className="required">*</span></label>
          <FormField>
            <Select options={templateOptions}
              value={template._id}
              onChange={(e) => {
                this.props.changeTemplate(model, metadata, templates.find((t) => t._id === e.target.value));
              }}
            />
          </FormField>
        </FormGroup>

        {template.properties.map((property, index) => {
          return (
            <FormGroup key={index} {...state.fields[`metadata.${property.name}`]} submitFailed={state.submitFailed}>
              <label>
                {property.label}
                {property.required ? <span className="required">*</span> : ''}
              </label>
              <FormField model={`${model}.metadata.${property.name}`} >
                {(() => {
                  if (property.type === 'select') {
                    return <Select optionsValue='id' options={thesauris.find((t) => t._id.toString() === property.content.toString()).values} />;
                  }
                  if (property.type === 'multiselect') {
                    return <MultiSelect optionsValue='id' options={thesauris.find((t) => t._id.toString() === property.content.toString()).values} />;
                  }
                  if (property.type === 'date') {
                    return <DatePicker/>;
                  }
                  if (property.type === 'markdown') {
                    return <MarkDown/>;
                  }
                  if (property.type === 'violatedarticles') {
                    return <ViolatedArticles/>;
                  }
                  return <input className="form-control"/>;
                })()}
              </FormField>
            </FormGroup>
            );
        })}
      </Form>
    );
  }
}

MetadataForm.propTypes = {
  metadata: PropTypes.object,
  model: PropTypes.string.isRequired,
  state: PropTypes.object,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  changeTemplate: PropTypes.func,
  onSubmit: PropTypes.func
};

export default MetadataForm;
