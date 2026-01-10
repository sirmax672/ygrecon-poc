"""WebSocket API for validation and simulation with session management."""

import json
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from ..shared.dsl_schema import GraphDSL, ValidationIssue, NodeDef, EdgeDef, NodePosition
from ..validation.dsl_validator import validate_dsl_structure
from ..graph.nodes import create_node_instance
from ..graph.edge_instance import EdgeInstance, normalize_handle_id
from .session import create_session, get_session, delete_session


async def handle_websocket(websocket: WebSocket):
    """Handle WebSocket connection for validation and simulation."""
    await websocket.accept()
    print("INFO: WebSocket connection accepted")

    # Create session for this connection
    session = create_session()
    print(f"INFO: Created session {session.session_id}")

    # Send session_created message
    session_msg = {
        "type": "session_created",
        "payload": {
            "session_id": session.session_id,
            "graph": session.get_graph_dsl().model_dump(by_alias=True)
        }
    }
    print(f"INFO: Sending message: {json.dumps(session_msg)[:200]}...")
    await websocket.send_json(session_msg)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            print(f"INFO: Received message: {data[:100]}...")  # Log first 100 chars

            try:
                message = json.loads(data)
            except json.JSONDecodeError as e:
                error_msg = {
                    "type": "error",
                    "payload": {
                        "message": f"Invalid JSON: {str(e)}",
                        "code": "INVALID_JSON"
                    }
                }
                print(f"INFO: Sending message: {json.dumps(error_msg)[:200]}...")
                await websocket.send_json(error_msg)
                continue

            message_type = message.get("type")
            payload = message.get("payload", {})

            # Route message to appropriate handler
            if message_type == "create_node":
                response = await handle_create_node(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "update_node":
                response = await handle_update_node(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "delete_node":
                response = await handle_delete_node(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "create_edge":
                response = await handle_create_edge(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "update_edge":
                response = await handle_update_edge(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "delete_edge":
                response = await handle_delete_edge(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "get_graph":
                response = await handle_get_graph(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "load_project":
                response = await handle_load_project(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            elif message_type == "save_project":
                response = await handle_save_project(session, payload)
                print(f"INFO: Sending message: {json.dumps(response)[:200]}...")
                await websocket.send_json(response)

            else:
                # Unknown message type
                error_msg = {
                    "type": "error",
                    "payload": {
                        "message": f"Unknown message type: {message_type}",
                        "code": "UNKNOWN_MESSAGE_TYPE"
                    }
                }
                print(f"INFO: Sending message: {json.dumps(error_msg)[:200]}...")
                await websocket.send_json(error_msg)

    except WebSocketDisconnect:
        print(f"INFO: WebSocket disconnected, cleaning up session {session.session_id}")
        delete_session(session.session_id)
    except Exception as e:
        print(f"ERROR: WebSocket error: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            error_msg = {
                "type": "error",
                "payload": {
                    "message": f"Server error: {str(e)}",
                    "code": "SERVER_ERROR"
                }
            }
            print(f"INFO: Sending message: {json.dumps(error_msg)[:200]}...")
            await websocket.send_json(error_msg)
        except:
            pass  # Connection might be closed
        finally:
            delete_session(session.session_id)


async def handle_create_node(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle create_node message."""
    node_id = payload.get("node_id")
    node_type = payload.get("node_type")
    params = payload.get("params", {})
    position = payload.get("position")

    if not node_id or not node_type:
        return {
            "type": "node_created",
            "payload": {
                "node_id": node_id or "",
                "valid": False,
                "issues": [{
                    "code": "MISSING_REQUIRED_FIELDS",
                    "message": "node_id and node_type are required",
                    "node_id": node_id
                }]
            }
        }

    # Check if node already exists
    if any(n.node_def.id == node_id for n in session.graph.nodes):
        return {
            "type": "node_created",
            "payload": {
                "node_id": node_id,
                "valid": False,
                "issues": [{
                    "code": "DUPLICATE_NODE_ID",
                    "message": f"Node with ID {node_id} already exists",
                    "node_id": node_id
                }]
            }
        }

    # Create node definition
    node_def = NodeDef(
        id=node_id,
        type=node_type,
        params=params,
        position=NodePosition(**position) if position else None
    )

    # Create node instance and add to graph
    node_instance = create_node_instance(node_def)
    session.graph.nodes.append(node_instance)

    return {
        "type": "node_created",
        "payload": {
            "node_id": node_id,
            "valid": True
        }
    }


async def handle_update_node(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle update_node message."""
    node_id = payload.get("node_id")
    params = payload.get("params")
    position = payload.get("position")

    if not node_id:
        return {
            "type": "error",
            "payload": {
                "message": "node_id is required",
                "code": "MISSING_NODE_ID"
            }
        }

    # Find node instance
    node_instance = next((n for n in session.graph.nodes if n.node_def.id == node_id), None)
    if not node_instance:
        return {
            "type": "error",
            "payload": {
                "message": f"Node {node_id} not found",
                "code": "NODE_NOT_FOUND",
                "node_id": node_id
            }
        }

    # Update node definition
    if params is not None:
        node_instance.node_def.params.update(params)
    if position is not None:
        node_instance.node_def.position = NodePosition(**position)

    return {
        "type": "node_updated",
        "payload": {
            "node_id": node_id,
            "valid": True
        }
    }


async def handle_delete_node(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle delete_node message."""
    node_id = payload.get("node_id")

    if not node_id:
        return {
            "type": "error",
            "payload": {
                "message": "node_id is required",
                "code": "MISSING_NODE_ID"
            }
        }

    # Find and remove node instance
    node_instance = next((n for n in session.graph.nodes if n.node_def.id == node_id), None)
    if not node_instance:
        return {
            "type": "error",
            "payload": {
                "message": f"Node {node_id} not found",
                "code": "NODE_NOT_FOUND",
                "node_id": node_id
            }
        }

    # Remove node instance
    session.graph.nodes = [n for n in session.graph.nodes if n.node_def.id != node_id]

    # Remove all edge instances connected to this node
    session.graph.edges = [
        e for e in session.graph.edges
        if e.edge_def.from_ != node_id and e.edge_def.to != node_id
    ]

    return {
        "type": "node_deleted",
        "payload": {
            "node_id": node_id
        }
    }


async def handle_create_edge(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle create_edge message."""
    edge_id = payload.get("edge_id")
    from_node_id = payload.get("from_node_id")
    to_node_id = payload.get("to_node_id")
    source_handle = payload.get("source_handle")
    target_handle = payload.get("target_handle")
    edge_params = payload.get("params", {})

    if not edge_id or not from_node_id or not to_node_id:
        return {
            "type": "edge_created",
            "payload": {
                "edge_id": edge_id or "",
                "valid": False,
                "issues": [{
                    "code": "MISSING_REQUIRED_FIELDS",
                    "message": "edge_id, from_node_id, and to_node_id are required",
                    "edge_id": edge_id
                }]
            }
        }

    # Check if nodes exist (as instances)
    from_node_instance = next((n for n in session.graph.nodes if n.node_def.id == from_node_id), None)
    to_node_instance = next((n for n in session.graph.nodes if n.node_def.id == to_node_id), None)

    if not from_node_instance:
        return {
            "type": "edge_created",
            "payload": {
                "edge_id": edge_id,
                "valid": False,
                "issues": [{
                    "code": "NODE_NOT_FOUND",
                    "message": f"Source node {from_node_id} not found",
                    "node_id": from_node_id,
                    "edge_id": edge_id
                }]
            }
        }

    if not to_node_instance:
        return {
            "type": "edge_created",
            "payload": {
                "edge_id": edge_id,
                "valid": False,
                "issues": [{
                    "code": "NODE_NOT_FOUND",
                    "message": f"Target node {to_node_id} not found",
                    "node_id": to_node_id,
                    "edge_id": edge_id
                }]
            }
        }

    # Check if edge already exists (as instance)
    if any(e.edge_def.id == edge_id for e in session.graph.edges):
        return {
            "type": "edge_created",
            "payload": {
                "edge_id": edge_id,
                "valid": False,
                "issues": [{
                    "code": "DUPLICATE_EDGE_ID",
                    "message": f"Edge with ID {edge_id} already exists",
                    "edge_id": edge_id
                }]
            }
        }

    # Prepare edge params
    params = {
        "sourceHandle": source_handle,
        "targetHandle": target_handle,
        **edge_params
    }

    # Create edge definition
    edge_def = EdgeDef(
        id=edge_id,
        from_=from_node_id,
        to=to_node_id,
        params=params
    )

    # Create edge instance for validation
    edge_instance = EdgeInstance(edge_def)

    # Normalize handles
    source_handle_norm = normalize_handle_id(source_handle)
    target_handle_norm = normalize_handle_id(target_handle)

    # Collect all validation issues
    issues: list[ValidationIssue] = []

    # 1. Validate edge structure (duplicates, reverse connections)
    issues.extend(edge_instance.validate_structure(session.graph))

    # 2. Validate from node's connection (outgoing)
    if not issues:  # Only check node types if structure is valid
        node_issues = from_node_instance.validate_connection(
            session.graph,
            from_node_id,
            to_node_id,
            source_handle_norm,
            target_handle_norm,
            edge_id,
        )
        issues.extend(node_issues)

    # 3. Validate to node's connection (incoming)
    if not issues:  # Only check if previous validations passed
        node_issues = to_node_instance.validate_connection(
            session.graph,
            from_node_id,
            to_node_id,
            source_handle_norm,
            target_handle_norm,
            edge_id,
        )
        issues.extend(node_issues)

    if issues:
        # Validation failed, don't add edge
        return {
            "type": "edge_created",
            "payload": {
                "edge_id": edge_id,
                "valid": False,
                "issues": [issue.model_dump() for issue in issues]
            }
        }

    # Validation passed, add edge instance to graph
    session.graph.edges.append(edge_instance)

    return {
        "type": "edge_created",
        "payload": {
            "edge_id": edge_id,
            "valid": True
        }
    }


async def handle_update_edge(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle update_edge message."""
    edge_id = payload.get("edge_id")
    params = payload.get("params")

    if not edge_id:
        return {
            "type": "error",
            "payload": {
                "message": "edge_id is required",
                "code": "MISSING_EDGE_ID"
            }
        }

    # Find edge instance
    edge_instance = next((e for e in session.graph.edges if e.edge_def.id == edge_id), None)
    if not edge_instance:
        return {
            "type": "error",
            "payload": {
                "message": f"Edge {edge_id} not found",
                "code": "EDGE_NOT_FOUND",
                "edge_id": edge_id
            }
        }

    # Update edge definition params (merge, not replace, to preserve existing params)
    if params is not None:
        # Merge params to preserve existing values
        edge_instance.edge_def.params = {**edge_instance.edge_def.params, **params}

    return {
        "type": "edge_updated",
        "payload": {
            "edge_id": edge_id,
            "valid": True
        }
    }


async def handle_delete_edge(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle delete_edge message."""
    edge_id = payload.get("edge_id")

    if not edge_id:
        return {
            "type": "error",
            "payload": {
                "message": "edge_id is required",
                "code": "MISSING_EDGE_ID"
            }
        }

    # Find and remove edge instance
    edge_instance = next((e for e in session.graph.edges if e.edge_def.id == edge_id), None)
    if not edge_instance:
        return {
            "type": "error",
            "payload": {
                "message": f"Edge {edge_id} not found",
                "code": "EDGE_NOT_FOUND",
                "edge_id": edge_id
            }
        }

    # Remove edge instance
    session.graph.edges = [e for e in session.graph.edges if e.edge_def.id != edge_id]

    return {
        "type": "edge_deleted",
        "payload": {
            "edge_id": edge_id
        }
    }


async def handle_get_graph(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle get_graph message - return current graph state."""
    return {
        "type": "graph_state",
        "payload": {
            "graph": session.get_graph_dsl().model_dump(by_alias=True)
        }
    }


async def handle_load_project(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle load_project message - load project from DB into session."""
    from ..db.database import SessionLocal
    from ..db.models import Project, User

    project_id = payload.get("project_id")
    # TODO: Get from authentication - for now, get test user same way as REST API
    if not project_id:
        return {
            "type": "error",
            "payload": {
                "message": "project_id is required",
                "code": "MISSING_PROJECT_ID"
            }
        }

    # Get database session
    db = SessionLocal()
    try:
        # Get test user (same as REST API)
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                email="test@example.com",
                username="testuser",
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        print(f"INFO: Loading project {project_id} for user_id: {test_user.id}")

        # Load project from DB
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == test_user.id  # Use real user ID from DB
        ).first()

        if not project:
            print(f"INFO: Project not found. Available projects for user:")
            all_projects = db.query(Project).filter(Project.user_id == test_user.id).all()
            for p in all_projects:
                print(f"  - {p.id}: {p.name}")
            return {
                "type": "error",
                "payload": {
                    "message": "Project not found",
                    "code": "PROJECT_NOT_FOUND"
                }
            }

        # Parse DSL JSON and load graph into session
        dsl = GraphDSL.model_validate_json(project.dsl_data)
        session.load_from_dsl(dsl)
        session.set_project_id(project_id)

        return {
            "type": "project_loaded",
            "payload": {
                "project_id": project_id,
                "graph": dsl.model_dump(by_alias=True)
            }
        }
    finally:
        db.close()


async def handle_save_project(session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle save_project message - save session state to project."""
    from ..db.database import SessionLocal
    from ..db.models import Project, User
    from datetime import datetime

    # Use project_id from payload, or fall back to session.project_id (set during load_project)
    project_id = payload.get("project_id") or session.project_id
    name = payload.get("name")
    # TODO: Get from authentication - for now, get test user same way as REST API

    print(f"INFO: Saving project, project_id from payload: {payload.get('project_id')}, session.project_id: {session.project_id}, using: {project_id}")

    # Get database session
    db = SessionLocal()
    try:
        # Get test user (same as REST API)
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                email="test@example.com",
                username="testuser",
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        print(f"INFO: Using user_id: {test_user.id}")

        if project_id:
            # Update existing project
            project = db.query(Project).filter(
                Project.id == project_id,
                Project.user_id == test_user.id  # Use real user ID from DB
            ).first()

            if not project:
                return {
                    "type": "error",
                    "payload": {
                        "message": "Project not found",
                        "code": "PROJECT_NOT_FOUND"
                    }
                }

            # Update project
            if name:
                project.name = name
            project.dsl_data = session.get_graph_dsl().model_dump_json()
            project.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(project)

            # Ensure session is linked to this project
            session.set_project_id(project.id)

            return {
                "type": "project_saved",
                "payload": {
                    "project_id": project.id
                }
            }
        else:
            # Create new project
            if not name:
                return {
                    "type": "error",
                    "payload": {
                        "message": "name is required when creating new project",
                        "code": "MISSING_PROJECT_NAME"
                    }
                }

            # Create project
            project = Project(
                user_id=test_user.id,  # Use real user ID from DB
                name=name,
                description=payload.get("description"),
                dsl_data=session.get_graph_dsl().model_dump_json(),
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            # Link session to project
            session.set_project_id(project.id)

            return {
                "type": "project_saved",
                "payload": {
                    "project_id": project.id
                }
            }
    finally:
        db.close()
