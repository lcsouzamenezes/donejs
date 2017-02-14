import DefineMap from 'can-define/map/';
import DefineList from 'can-define/list/';
import set from 'can-set';
import superMap from 'can-connect/can/super-map/';
import loader from '@loader';

const Message = DefineMap.extend({
  seal: false
}, {
  'id': '*',
  name: 'string',
  body: 'string'
});

const algebra = new set.Algebra(
  set.props.id('id')
);

Message.List = DefineList.extend({
  '*': Message
});

Message.connection = superMap({
  url: loader.serviceBaseURL + '/api/messages',
  Map: Message,
  List: Message.List,
  name: 'message',
  algebra
});

export default Message;
