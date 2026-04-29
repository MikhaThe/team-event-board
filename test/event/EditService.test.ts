import { EventService } from "../../src/event/EventService";
import type { IEventRepository } from "../../src/event/EventRepository";
import { Ok, Err } from "../../src/lib/result";
import type { Event } from "../../src/event/Event";

describe("EventService - editEvent & saveEvent", () => {
  let mockRepo: jest.Mocked<IEventRepository>;
  let service: EventService;

  const baseEvent: Event = {
    id: "1",
    title: "Original Title",
    description: "desc",
    location: "UMass",
    category: "School",
    status: "published",
    organizerId: "user1",
    organizerName: "User One",
    startDatetime: "2099-01-01T10:00:00",
    endDatetime: "2099-01-01T12:00:00",
    attendeeCount: 0,
    capacity: 10,
  };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      searchPublishedUpcoming: jest.fn(),
      listPublishedUpcoming: jest.fn(),
      findByOrganizerId: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    service = new EventService(mockRepo);
  });

  // -------------------------------
  // editEvent
  // -------------------------------
  describe("editEvent", () => {
    it("updates event when user is owner", async () => {
      mockRepo.findById.mockResolvedValue(Ok(baseEvent));
      mockRepo.save.mockResolvedValue(Ok(undefined));

      const result = await service.editEvent(
        "1",
        { title: "Updated Title" },
        "user1",
        "user"
      );

      expect(result.ok).toBe(true);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "1",
          title: "Updated Title",
        })
      );
    });

    it("updates event when user is admin", async () => {
      mockRepo.findById.mockResolvedValue(Ok(baseEvent));
      mockRepo.save.mockResolvedValue(Ok(undefined));

      const result = await service.editEvent(
        "1",
        { title: "Admin Edit" },
        "someoneElse",
        "admin"
      );

      expect(result.ok).toBe(true);
    });

    it("returns Forbidden if not owner or admin", async () => {
      mockRepo.findById.mockResolvedValue(Ok(baseEvent));

      const result = await service.editEvent(
        "1",
        { title: "Hack Edit" },
        "otherUser",
        "user"
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.value.name).toBe("Forbidden");
      }

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("returns EventNotFound if event does not exist", async () => {
      mockRepo.findById.mockResolvedValue(Ok(null));

      const result = await service.editEvent(
        "1",
        { title: "Update" },
        "user1",
        "user"
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.value.name).toBe("EventNotFound");
      }
    });

    it("returns error if save fails", async () => {
      mockRepo.findById.mockResolvedValue(Ok(baseEvent));
      mockRepo.save.mockResolvedValue(Err("fail"));

      const result = await service.editEvent(
        "1",
        { title: "Update" },
        "user1",
        "user"
      );

      expect(result.ok).toBe(false);
    });
  });

  // -------------------------------
  // saveEvent
  // -------------------------------
  describe("saveEvent", () => {
    it("saves event successfully", async () => {
      mockRepo.save.mockResolvedValue(Ok(undefined));

      const result = await service.saveEvent(baseEvent);

      expect(result.ok).toBe(true);
      expect(mockRepo.save).toHaveBeenCalledWith(baseEvent);
    });

    it("returns error if save fails", async () => {
      mockRepo.save.mockResolvedValue(Err("fail"));

      const result = await service.saveEvent(baseEvent);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.value.name).toBe("EventNotFound");
      }
    });
  });
});