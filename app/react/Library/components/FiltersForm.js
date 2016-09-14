import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';

import {FormField, MultiSelect, DateRange, ViolatedArticlesFilter} from 'app/Forms';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {toggleFilter, activateFilter} from 'app/Library/actions/filterActions';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import {store} from 'app/store';

export class FiltersForm extends Component {

  onChange(e) {
    if (e.target.type === 'checkbox') {
      this.props.searchDocuments(store.getState().search);
    }
  }

  render() {
    let fields = this.props.fields.toJS();
    fields = libraryHelper.parseWithAggregations(fields, this.props.aggregations.toJS())
    .filter((field) => (field.type !== 'select' && field.type !== 'multiselect') || field.options.length);
    return (
      <div className="filters-box">
        {(() => {
          let documentTypes = this.props.documentTypes.toJS();
          let templates = this.props.templates.toJS();
          let activeTypes = templates.filter((template) => documentTypes.includes(template._id));

          if (documentTypes.length === 0) {
            return <div className="empty-state select-type">
                    <i className="fa fa-arrow-up"></i><b>Select to start filtering</b>
                  </div>;
          }

          if (activeTypes.length > 0 && fields.length === 0) {
            return <div className="empty-state no-filters">
                    <i className="fa fa-close"></i><b>No common filters</b>
                  </div>;
          }
        })()}
        <Form model="search" id="filtersForm" onSubmit={this.props.searchDocuments} onChange={this.onChange.bind(this)}>
        {fields.map((property, index) => {
          let propertyClass = property.active ? 'search__filter is-active' : 'search__filter';
          if (property.type === 'select' || property.type === 'multiselect') {
            return (
              <FormGroup key={index}>
                <FormField model={`search.filters.${property.name}`}>
                  <ul className={propertyClass}>
                    <li>
                      {property.label}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </li>
                    <li className="wide">
                      <MultiSelect
                        prefix={property.name}
                        options={property.options}
                        optionsValue="id" onChange={(options) => this.props.activateFilter(property.name, !!options.length)}
                      />
                    </li>
                  </ul>
                </FormField>
              </FormGroup>
              );
          }
          if (property.type === 'violatedarticles') {
            return (
              <FormGroup key={index}>
                  <ul className={propertyClass}>
                    <li>
                      {property.label}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </li>
                    <li className="wide">
                      <ViolatedArticlesFilter aggregations={this.props.aggregations} property={property} onChange={() => this.props.activateFilter(property.name, true)}/>
                    </li>
                  </ul>
              </FormGroup>
              );
          }
          if (property.type === 'date') {
            return (
              <FormGroup key={index}>
                <ul className={propertyClass}>
                  <li>
                    {property.label}
                    {property.required ? <span className="required">*</span> : ''}
                    <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                  </li>
                  <li className="wide">
                    <DateRange
                      fromModel={`search.filters.${property.name}.from`}
                      toModel={`search.filters.${property.name}.to`}
                      fromChange={() => this.props.activateFilter(property.name, true)}
                      toChange={() => this.props.activateFilter(property.name, true)}
                    />
                  </li>
                </ul>
              </FormGroup>
              );
          }
          return (
            <FormGroup key={index}>
              <Field model={`search.filters.${property.name}`} >
                <ul className={propertyClass}>
                  <li>
                    <label>
                      {property.label}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </label>
                  </li>
                  <li className="wide">
                    <input className="form-control" onChange={(e) => this.props.activateFilter(property.name, !!e.target.value)} />
                  </li>
                </ul>
              </Field>
            </FormGroup>
            );
        })}
        </Form>
      </div>
    );
  }
}

FiltersForm.propTypes = {
  templates: PropTypes.object,
  aggregations: PropTypes.object,
  fields: PropTypes.object.isRequired,
  searchDocuments: PropTypes.func,
  toggleFilter: PropTypes.func,
  activateFilter: PropTypes.func,
  search: PropTypes.object,
  documentTypes: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    fields: state.library.filters.get('properties'),
    aggregations: state.library.aggregations,
    templates: state.templates,
    search: state.search,
    documentTypes: state.library.filters.get('documentTypes')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, toggleFilter, activateFilter}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
