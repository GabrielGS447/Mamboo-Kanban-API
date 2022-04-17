import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { taskModel } from '../../../src/database'
import tasksSeed from '../../../src/database/tasksSeed.json'
import { fetchEndpoint } from '../__helpers__'

const endpoint = '/tasks'

// const newTasks = [
//   {
//     boardId: 2,
//     status: 'todo',
//     title: 'task that I need to do',
//     priority: 1,
//   },
//   {
//     boardId: 1,
//     status: 'in_progress',
//     title: 'task that I am doing',
//     priority: 2,
//   },
//   {
//     boardId: 1,
//     status: 'in_progress',
//     title: 'task that I am also doing but is more important',
//     priority: 5,
//   },
//   {
//     boardId: 1,
//     status: 'done',
//     title: 'task that I have done',
//     priority: 3,
//   },
// ]

describe('Tasks Read endpoint integration tests', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create() // Here we create the mongoDB instance in memory so we can test without using our database (and it's really fast)
    const uri = mongod.getUri() // Get the URI of the database we just created
    await mongoose.connect(uri) // Here we connect to the mongoDB instance in memory so our application can use it
  })
  
  afterAll(async () => {
    await mongoose.connection.close() // Here we close the connection to the mongoDB instance in memory
    await mongod.stop() // Here we stop the mongoDB instance in memory
  })

  describe('When there are no tasks in the collection', () => {
    it('Should 200 with data property being an empty array', async () => {
      const { status, body } = await fetchEndpoint(endpoint)

      expect(status).toBe(200)
      expect(body.data).toEqual([])
    })
  })

  describe('When there are tasks in the collection', () => {
    beforeAll(async () => {
      await taskModel.insertMany(tasksSeed)
    })

    describe('When fetching first page', () => {
      it('Should 200 with data containing 5 tasks ordered by boardId, status and priority and nextPage with value 2', async () => {
        const { status, body } = await fetchEndpoint(endpoint)
  
        expect(status).toBe(200)
        expect(body.nextPage).toBe(2)
        expect(body.previousPage).toBeUndefined()
        expect(body.data).toHaveLength(5)
        expect(body.data[0]).toHaveProperty('_id')
        expect(body.data[0].boardId).toBe(1)
        expect(body.data[0].status).toBe('backlog')
        expect(body.data[0].priority).toBe(1)
        expect(body.data[1]).toHaveProperty('_id')
        expect(body.data[1].boardId).toBe(1)
        expect(body.data[1].status).toBe('done')
        expect(body.data[1].priority).toBe(4)
        expect(body.data[2]).toHaveProperty('_id')
        expect(body.data[2].boardId).toBe(1)
        expect(body.data[2].status).toBe('in_progress')
        expect(body.data[2].priority).toBe(5)
      })
    })

    describe('When fetching second page', () => {
      it('Should 200 with previousPage being 1 and nextPage being 3', async () => {
        const { status, body } = await fetchEndpoint(endpoint + '?page=2')

        expect(status).toBe(200)
        expect(body.nextPage).toBe(3)
        expect(body.previousPage).toBe(1)
        expect(body.data).toHaveLength(5)
      })
    })

    describe('When fetching last page (6)', () => {
      it('Should 200 with previousPage being 5 and nextPage being undefined', async () => {
        const { status, body } = await fetchEndpoint(endpoint + '?page=6')

        expect(status).toBe(200)
        expect(body.nextPage).toBeUndefined()
        expect(body.previousPage).toBe(5)
        expect(body.data).toHaveLength(3)
      })
    })
  })
})