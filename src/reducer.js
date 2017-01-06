/**
 * @flow weak
 * @file cartReducer
 *
 * @author Oleg Nosov <olegnosov1@gmail.com>
 * @license MIT
 *
 * @description
 * Redux reducer to operate with cart
 *
 */
import * as actionTypes from './actionTypes';

const initialState = { total: 0, summary: '', products: {}, currency: '£' };
const actionVals : Object = {};
Object.values(actionTypes).forEach(v => void (actionVals[v] = true));

const getTotal = (products : ProductsMapType, currency: string) : number =>
  Object
    .values(products)
    .map(({ quantity, productInfo: { prices } }) => quantity * prices[currency])
    .reduce((s : number, v : number) => v + s, 0);

/**
 * Generate description in format
 * product.name: product.quantity product.properties[...]
 * For Example 'MacBook case: 1; The West End: 1 nickel finish XS:31”;'
 */
const getSummary = (products : ProductsMapType) : string =>
  Object
    .entries(products)
    .map(
      ([productKey, { quantity, properties, productInfo: { name } }]) =>
      `${`${name}:` +
      ` ${quantity}`}${
      Object
        .values(properties)
        .reduce(
          (str, propValue) => str + (propValue && ` ${propValue}` || ''), '',
        )}`,
    )
    .join('; ');

/**
 * @module cartReducer
 * @description
 * Default state value is { total: 0, summary: '', products: {} }
 */
export default function(
  state : CartType = initialState,
  action : CartActionType,
) : CartType {
  if (actionVals[action.type]) {
    const {
      type,
      id,
      key,
      quantity,
      productInfo,
      updateProps,
      properties,
    } = action;

    const propsValues = Object.values(properties || {});
    /**
     * Product key is a string in format id_props1_props2 etc
     */
    const productKey =
      key || id + (propsValues.length ? `_${propsValues.join('_')}` : '');
    const { products, total, summary, ...restOfCart } = state;
    const { [productKey]: product, ...restOfProducts } = products;
    const currency = action.currency || state.currency;
    switch (type) {
      case actionTypes.CART_ADD: {
        const newProducts = {
          [productKey]: {
            id,
            quantity:
              quantity + (
                !!products[productKey] && products[productKey].quantity
              ),
            properties,
            productInfo,
          },
          ...restOfProducts,
        };
        return ({
          ...restOfCart,
          total: getTotal(newProducts, currency),
          summary: getSummary(newProducts),
          products: newProducts,
        });
      }
      case actionTypes.CART_REMOVE: {
        return {
          ...restOfCart,
          total: getTotal(restOfProducts, currency),
          summary: getSummary(restOfProducts),
          products: restOfProducts,
        };
      }
      case actionTypes.CART_UPDATE: {
        const updatedProducts = {
          ...products,
          [productKey]: {
            ...product,
            ...updateProps,
          },
        };
        return ({
          ...restOfCart,
          summary,
          total: getTotal(updatedProducts, currency),
          products: updatedProducts,
        });
      }
      case actionTypes.CART_SET_CURRENCY: {
        return ({
          ...state,
          total: getTotal(products, currency),
          currency,
        });
      }
      case actionTypes.CART_EMPTY: {
        return initialState;
      }
    }
  }
  return state;
}
