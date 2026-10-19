export type Language = 'ru' | 'ua' | 'en';

export interface Translations {
  nav: {
    orders: string;
    groups: string;
    products: string;
    users: string;
    analytics: string;
    settings: string;
    userSettings: string;
  };
  topMenu: {
    searchPlaceholder: string;
    active: string;
    activeSessionsTitle: string;
    logout: string;
    demoGoogleLogin: string;
    googleOAuth: string;
    daysOfWeek: string[];
    months: string[];
  };
  orders: {
    title: string;
    addOrder: string;
    addOrderPrompt: string;
    empty: string;
    products: string;
    viewProducts: string;
    deleteOrder: string;
    detailPanelTitle: string;
    closeDetail: string;
    addProduct: string;
    addProductPrompt: string;
    emptyDetailProducts: string;
    deleteProductFromOrder: string;
    deleteOrderConfirmTitle: string;
    cancel: string;
    delete: string;
    deleting: string;
    close: string;
    productsCountPrefix: string;
  };
  products: {
    title: string;
    type: string;
    allTypes: string;
    specification: string;
    allSpecifications: string;
    viewMode: string;
    viewOptimized: string;
    viewClassic: string;
    colTitle: string;
    colStatus: string;
    colGuarantee: string;
    colPrice: string;
    colBinding: string;
    guaranteeFrom: string;
    guaranteeTo: string;
    statusInRepair: string;
    statusAvailable: string;
    conditionNew: string;
    conditionUsed: string;
    conditionRefurbished: string;
    deleteConfirm: string;
    empty: string;
    deleteProduct: string;
    bindingOrder: string;
    bindingUser: string;
    notAssigned: string;
  };
  users: {
    title: string;
    loading: string;
    role: string;
  };
  groups: {
    title: string;
    loading: string;
    productsInGroup: string;
  };
  analytics: {
    title: string;
    workerAggregation: string;
    items: string;
  };
  settings: {
    title: string;
    langTitle: string;
    langDesc: string;
    tableModeTitle: string;
    tableModeDesc: string;
    authTitle: string;
    authDesc: string;
    loggedInAs: string;
    role: string;
    logout: string;
    demoGoogleLogin: string;
    loginWithGoogle: string;
  };
}
