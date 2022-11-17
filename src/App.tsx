import { observer } from 'mobx-react-lite';
import './App.css';
import { useStore } from './context';

const App = observer(() => {
  const store = useStore();
  return (
    <div className="right">
      <h4>每一个灰色地毯代表一组服务</h4>
      <h4>每一个长柱体代表一个服务</h4>
      <h4>长柱体高度代表cpu使用率</h4>
      <h4>绿灯闪烁代表服务正常运行</h4>
      <h4>点击长柱体显示具体信息</h4>
      {store.currentService?.name}
      {store.currentService?.data &&
        Object.entries(store.currentService.data).map(([key, value]) => (
          <div key={key}>
            {key}: {value}
          </div>
        ))}
    </div>
  );
});

export default App;
