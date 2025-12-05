const cuentaController = require('../controller/cuentaController'); 
const db = require('../models');
const bcrypt = require('bcrypt');

// Mock de los módulos externos
jest.mock('../models', () => {
  const mockFindOne = jest.fn();
  const mockCreate = jest.fn();
  const mockFindAll = jest.fn();
  const mockTransaction = jest.fn();
  
  return {
    cuenta: {
      findOne: mockFindOne,
      create: mockCreate,
      findAll: mockFindAll,
    },
    persona: {
      findOne: mockFindOne, 
      create: mockCreate,
    },
    colaborador: {},
    sequelize: {
      transaction: mockTransaction
    }
  };
});

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn()
}));

describe('CuentaController', () => {
  let req, res;
  let mockTransactionObj;


  beforeEach(() => {
    
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(), 
      json: jest.fn()
    };

    
    jest.clearAllMocks();

   
    mockTransactionObj = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    db.sequelize.transaction.mockResolvedValue(mockTransactionObj);
  });

  /**
   * TEST: HU5 Registrar
   */
  describe('registrar', () => {
    test('Debe registrar exitosamente (201)', async () => {
      req.body = {
        nombre: 'Juan', apellido: 'Perez', cedula: '110500', correo: 'juan@test.com', contrasena: '123'
      };

      // 1. Simular que NO existe correo
      db.cuenta.findOne.mockResolvedValue(null);
      // 2. Simular que NO existe cédula (Ojo: en tu código usas db.persona, aquí simplificamos el mock global)
      // Como db.persona y db.cuenta son mocks separados en la realidad, aseguramos comportamiento:
      require('../models').persona.findOne = jest.fn().mockResolvedValue(null);

      // 3. Simular hash
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // 4. Simular creaciones
      require('../models').persona.create = jest.fn().mockResolvedValue({ id: 1 });
      db.cuenta.create.mockResolvedValue({ external: 'uuid-123' });

      await cuentaController.registrar(req, res);

      expect(mockTransactionObj.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        mensaje: expect.stringContaining("Registro exitoso"),
        cuenta_id: 'uuid-123'
      }));
    });

    test('Debe retornar error si el correo ya existe (400)', async () => {
      req.body = { correo: 'existente@test.com' };
      db.cuenta.findOne.mockResolvedValue({ id: 1 }); // Existe

      await cuentaController.registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ mensaje: "El correo ya está registrado." });
    });

    test('Debe hacer rollback si ocurre un error inesperado (500)', async () => {
      req.body = { correo: 'nuevo@test.com' };
      db.cuenta.findOne.mockRejectedValue(new Error("Error BD"));

      await cuentaController.registrar(req, res);

      expect(mockTransactionObj.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /**
   * TEST: HU6 Aprobar Cuenta
   */
  describe('aprobarCuenta', () => {
    test('Debe aprobar la cuenta correctamente (200)', async () => {
      req.params.external = 'uuid-123';
      
      const mockCuenta = {
        estado: false,
        save: jest.fn().mockResolvedValue(true) // Simular el .save()
      };
      db.cuenta.findOne.mockResolvedValue(mockCuenta);

      await cuentaController.aprobarCuenta(req, res);

      expect(mockCuenta.estado).toBe(true);
      expect(mockCuenta.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe retornar 404 si la cuenta no existe', async () => {
      req.params.external = 'uuid-fake';
      db.cuenta.findOne.mockResolvedValue(null);

      await cuentaController.aprobarCuenta(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  /**
   * TEST: HU7 Listar Cuentas Aprobadas
   */
  describe('listarCuentasAprobadas', () => {
    test('Debe retornar lista de cuentas (200)', async () => {
      const listaCuentas = [{ id: 1, correo: 'a@a.com', persona: { nombre: 'A', apellido: 'B' } }];
      db.cuenta.findAll.mockResolvedValue(listaCuentas);

      await cuentaController.listarCuentasAprobadas(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(listaCuentas);
    });

    test('Debe retornar 404 si no hay cuentas', async () => {
      db.cuenta.findAll.mockResolvedValue([]);

      await cuentaController.listarCuentasAprobadas(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  /**
   * TEST: HU7 Listar Cuentas Por Aprobar
   */
  describe('listarCuentasPorAprobar', () => {
    test('Debe mapear y retornar cuentas correctamente (200)', async () => {
      // Estructura compleja que espera tu mapeo
      const mockData = [{
        external: 'ext-1',
        correo: 'test@test.com',
        estado: false,
        esAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        persona: [{ nombre: 'Pepe', apellido: 'Mojica' }], // Array como en tu lógica de mapeo
        colaborador: []
      }];
      
      db.cuenta.findAll.mockResolvedValue(mockData);

      await cuentaController.listarCuentasPorAprobar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Verificar que el JSON de respuesta tiene la estructura mapeada (sin arrays en persona)
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          correo: 'test@test.com',
          persona: { nombre: 'Pepe', apellido: 'Mojica' }
        })
      ]));
    });

    test('Debe retornar 404 si el array está vacío', async () => {
      db.cuenta.findAll.mockResolvedValue([]);

      await cuentaController.listarCuentasPorAprobar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  /**
   * TEST: HU3 Desactivar Cuenta
   */
  describe('desactivarCuenta', () => {
    test('Debe desactivar la cuenta (200)', async () => {
      req.params.external = 'uuid-valid';
      const mockCuenta = {
        estado: true,
        save: jest.fn()
      };
      db.cuenta.findOne.mockResolvedValue(mockCuenta);

      await cuentaController.desactivarCuenta(req, res);

      expect(mockCuenta.estado).toBe(false);
      expect(mockCuenta.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe retornar 500 ante error de BD', async () => {
      req.params.external = 'uuid-valid';
      db.cuenta.findOne.mockRejectedValue(new Error("DB Falló"));

      await cuentaController.desactivarCuenta(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});