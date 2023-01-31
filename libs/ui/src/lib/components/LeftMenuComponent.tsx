import styles from "./LeftMenuComponent.module.scss";
import {Tree, TreeEventNodeParams} from "primereact/tree";
import React, {memo, useEffect, useRef, useState} from "react";
import TreeNode from "primereact/treenode";
import {Button} from "primereact/button";
import {TieredMenu} from "primereact/tieredmenu";
import {
  buildRootNodes,
  findArrayContainingKeyInsideATree,
  incrementKey,
  logReadableWritableProperties,
  makePropertiesWritable
} from "./helpers";
import {Menu} from "primereact/menu";
import * as jsonpath from "jsonpath";
import {EComponentType} from "./EComponentType";
import {IRootNode} from "./MatchingMenuAndForm";
import {useSelector} from "react-redux";
import {IAddCriteria} from "../../../../../apps/web/pages/store/slices/treeActionsSlice";
import {structuredClone} from "next/dist/compiled/@edge-runtime/primitives/structured-clone";

interface ILeftMenuComponentProps {
  onTreeNodeClick: (componentType: EComponentType, note: TreeNode) => void;
  rootNodesProp: IRootNode;
}

const LeftMenuComponent = memo((props: ILeftMenuComponentProps) => {

  const {onTreeNodeClick, rootNodesProp} = props;

  const [rootNodes, setRootNodes] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedKeys, setSelectedKeys] = useState<any>(null);
  const [expandedKeys, setExpandedKeys] = useState({0: true});

  const newNodeValue: IAddCriteria = useSelector((state: any) => state.treeActions.addCriteria);

  useEffect(() => {
    if (newNodeValue && newNodeValue.node && newNodeValue.type) {
      let {node, type} = newNodeValue;
      // redux makes all properties read-only, we will clone the object and make the properties writable
      // this has direct impact on how formData gets updated for each tree node
      // see onFormChange in ClinicalForm and GenomicFom components
      let newNode = structuredClone(node);
      makePropertiesWritable(newNode);

      addCriteria(newNode, type);
    }
  }, [newNodeValue]);

  const tieredMenu = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    if (rootNodesProp) {
      const {rootLabel, firstChildLabel} = rootNodesProp;
      if (rootLabel && firstChildLabel) {
        const roodNodes = buildRootNodes(rootLabel, firstChildLabel);
        setRootNodes(roodNodes);
        setSelectedKeys('0-0')
        const r = jsonpath.query(roodNodes, '$..[?(@.key=="0-0")]');
        if(r.length > 0) {
          // setIsEmpty(false);
          setSelectedNode(r[0]);
          onTreeNodeClick(r[0].data.type, r[0]);
        }
      }
    }
  }, [rootNodesProp]);

  const menuItems = [
    {
      label: 'Clinical',
      command: () => {
        const rootNodes = buildRootNodes('And', 'Clinical');
        setRootNodes(rootNodes);
        setSelectedKeys('0-0')
        const r = jsonpath.query(rootNodes, '$..[?(@.key=="0-0")]');
        if(r.length > 0) {
          console.log('r', r);
          setSelectedNode(r[0]);
          onTreeNodeClick(r[0].data.type, r[0]);
        }
        console.log('selectedKeys', selectedKeys);
      }
    },
    {
      label: 'Genomic',
      command: () => {
        const rootNodes = buildRootNodes('And', 'Genomic');
        setRootNodes(rootNodes);
        setSelectedKeys('0-0')
        console.log('selectedKeys', selectedKeys);
      }
    }
  ];

  const addCriteria = (node: TreeNode, type: string) => {
    if (node.key) {
      console.log('rootNodes[0]', rootNodes[0]);
      const parentNode = findArrayContainingKeyInsideATree(rootNodes[0], node.key as string);
      if (parentNode) {
        // get last element from the children
        const lastChild: TreeNode = parentNode.children![parentNode.children!.length - 1];
        const incrementedKey = incrementKey(lastChild.key as string);
        const newNode = {
          key: incrementedKey,
          label: type,
          data: {type: type === 'Clinical' ? EComponentType.ClinicalForm : EComponentType.GenomicForm},
        }
        parentNode.children!.push(newNode);
      }
      setRootNodes([...rootNodes]);
    }

  }

  const tieredMenuClick = (e: any) => {
    // @ts-ignore
    tieredMenu.current.show(e);
  }

  const menuClick = (e: any) => {
    // @ts-ignore
    menu.current.show(e);
  }

  const nodeTemplate = (node: TreeNode) => {

    const [isMouseOverNode, setIsMouseOverNode] = useState(false);

    const tieredMenuModel = [
      {
        label: 'Add criteria to the same list',
        icon: 'pi pi-plus-circle',
        items: [
          {
            label: 'Clinical',
            command: () => {
              addCriteria(node, 'Clinical');
            }
          },
          {
            label: 'Genomic',
            command: () => {
              addCriteria(node, 'Genomic');
            }
          }
        ]

      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
      },
      {
        separator:true
      },
      {
        label: 'Add criteria subgroup',
        icon: 'pi pi-clone',
        items: [
          {
            label: 'Clinical',
          },
          {
            label: 'Genomic',
          }
        ]
      }
    ]

    if (selectedNode) {
      const btnToShow = () => {
        let show = false;
        if ((selectedNode as TreeNode).key === node.key && isMouseOverNode) {
          show = true;
        }
        // show=true
        return show ?
          <Button icon="pi pi-ellipsis-h"
                  className={styles.treeMenuBtn}
                  iconPos="right" onClick={tieredMenuClick} ></Button> : null
      }

      let label = <b>{node.label}</b>;
      return (
        <>
          <div className={styles.treeNodeContainer}
            onMouseOver={() => setIsMouseOverNode(true)}
            onMouseOut={() => setIsMouseOverNode(false)}
          >
              <span className="p-treenode-label" style={{width: '80%'}}>
                {label}
              </span>
              {btnToShow()}
              <TieredMenu model={tieredMenuModel} popup ref={tieredMenu} />
          </div>

        </>
      );
    }
    return null;
  }

  const onNodeSelect = (node: TreeEventNodeParams) => {
    // console.log('selectedKeys', selectedKeys);
    // console.log('expandedKeys', expandedKeys);
    setSelectedNode(node.node);
    setSelectedKeys(node.node.key as string)
    onTreeNodeClick(node.node.data.type, node.node);
  }

  const onNodeToggle = (e: any) => {
    console.log('selectedKeys', selectedKeys);
    setExpandedKeys(e.value)
  }

  return (
    <>
      <Menu model={menuItems} ref={menu} popup id="criteria_popup_menu"/>
        <div className={styles.matchingCriteriaMenuContainer}>
          <div className={styles.matchingCriteriaTextContainer}>
            <div className={styles.matchingCriteriaText}>Matching Criteria</div>
            <i className="pi pi-plus-circle" onClick={(e) => {
              menuClick(e);
            }}></i>

          </div>
          <Tree value={rootNodes}
                nodeTemplate={nodeTemplate}
                expandedKeys={expandedKeys}
                selectionKeys={selectedKeys}
                selectionMode="single"
                onSelect={onNodeSelect}
                onToggle={e => onNodeToggle(e) } />
        </div>
    </>

    )

}, (prevProps, nextProps) => {
  return prevProps.rootNodesProp === nextProps.rootNodesProp;
});
export default LeftMenuComponent;
